import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { io as Client } from '../../frontend/node_modules/socket.io-client/build/esm/index.js';
import { AgentDeviceService } from '../src/services/AgentDeviceService.js';
import { AgentJobRouter } from '../src/services/AgentJobRouter.js';
import { setupAgentGateway } from '../src/sockets/agentGateway.js';
import { CodeExecutionService } from '../src/services/CodeExecutionService.js';
import { loadDb, saveDb } from '../src/lib/storage.js';
import { createApp } from '../src/app.js';

describe('Agent Gateway & Device Pairing Integration Suite', () => {
  let httpServer;
  let ioServer;
  let serverPort;
  let testUser1 = { id: 'usr_student_1', name: 'Student One', email: 'one@muj.in' };
  let testUser2 = { id: 'usr_student_2', name: 'Student Two', email: 'two@muj.in' };

  before(async () => {
    const app = await createApp();
    httpServer = createServer(app);
    ioServer = new Server(httpServer, {
      cors: { origin: '*' }
    });

    setupAgentGateway(ioServer);

    await new Promise((resolve) => {
      httpServer.listen(0, '127.0.0.1', () => {
        serverPort = httpServer.address().port;
        resolve();
      });
    });
  });

  after(async () => {
    if (ioServer) {
      for (const [, ns] of ioServer._nsps || []) {
        for (const [, s] of ns.sockets || []) {
          s.disconnect(true);
        }
      }
      await new Promise(r => ioServer.close(r));
    }
    if (httpServer && httpServer.listening) {
      await new Promise(r => httpServer.close(r));
    }
    setTimeout(() => process.exit(0), 50).unref();
  });

  describe('1. Challenge Generation & Validation', () => {
    it('should reject challenge generation without authenticated user', async () => {
      await assert.rejects(
        () => AgentDeviceService.generateChallenge(null),
        /Authentication required/i
      );
    });

    it('should generate an unpredictable 5-minute single-use pairing challenge', async () => {
      const challenge = await AgentDeviceService.generateChallenge(testUser1);
      assert.ok(challenge.challengeCode.startsWith('PAIR-'));
      assert.ok(challenge.challengeCode.length >= 10);
      assert.ok(challenge.expiresAt > Date.now());
      assert.strictEqual(challenge.lifetimeMs, 300000);
      assert.strictEqual(challenge.userDisplayName, 'Student One');
    });

    it('should atomically consume a challenge and prevent duplicate redemption', async () => {
      const challenge = await AgentDeviceService.generateChallenge(testUser1);
      const code = challenge.challengeCode;

      // First redemption: success
      const res1 = await AgentDeviceService.redeemChallenge(code, {
        deviceId: 'dev_test_unique_1',
        deviceName: 'Test Laptop',
        agentVersion: '1.0.0'
      });
      assert.strictEqual(res1.success, true);
      assert.ok(res1.deviceToken);
      assert.strictEqual(res1.userId, testUser1.id);

      // Second redemption with same code: MUST fail
      const res2 = await AgentDeviceService.redeemChallenge(code, {
        deviceId: 'dev_test_unique_2',
        deviceName: 'Another Laptop',
        agentVersion: '1.0.0'
      });
      assert.strictEqual(res2.success, false);
      assert.match(res2.error, /invalid or expired/i);
    });

    it('should reject expired pairing challenges', async () => {
      const db = loadDb();
      if (!db.agentPairingChallenges) db.agentPairingChallenges = [];

      db.agentPairingChallenges.push({
        challengeCode: 'PAIR-EXPIRED123',
        userId: testUser1.id,
        userDisplayName: 'Student One',
        createdAt: Date.now() - 400000,
        expiresAt: Date.now() - 1000, // Expired 1 second ago
        consumed: false
      });
      saveDb(db, 'agentPairingChallenges');

      const res = await AgentDeviceService.redeemChallenge('PAIR-EXPIRED123', {
        deviceId: 'dev_expired'
      });
      assert.strictEqual(res.success, false);
      assert.match(res.error, /invalid or expired/i);
    });
  });

  describe('2. Credential Storage, Authentication & Revocation', () => {
    let pairedToken;
    let pairedDeviceId = 'dev_auth_test_99';

    before(async () => {
      const challenge = await AgentDeviceService.generateChallenge(testUser1);
      const res = await AgentDeviceService.redeemChallenge(challenge.challengeCode, {
        deviceId: pairedDeviceId,
        deviceName: 'Rahul PC',
        agentVersion: '1.0.0'
      });
      pairedToken = res.deviceToken;
    });

    it('should authenticate a valid device token and retrieve user identity', async () => {
      const device = await AgentDeviceService.authenticateDevice(pairedToken);
      assert.ok(device);
      assert.strictEqual(device.deviceId, pairedDeviceId);
      assert.strictEqual(device.userId, testUser1.id);
      assert.strictEqual(device.deviceName, 'Rahul PC');
    });

    it('should reject invalid or tampered tokens', async () => {
      const device = await AgentDeviceService.authenticateDevice('invalid_token_123456');
      assert.strictEqual(device, null);
    });

    it('should prevent cross-user device access or revocation', async () => {
      // User 2 cannot revoke User 1's device
      const res = await AgentDeviceService.revokeDevice(testUser2.id, pairedDeviceId);
      assert.strictEqual(res.success, false);
      assert.match(res.error, /not owned by user/i);

      // User 2 device list does not contain User 1's device
      const user2Devices = await AgentDeviceService.getUserDevices(testUser2.id);
      assert.strictEqual(user2Devices.some(d => d.deviceId === pairedDeviceId), false);
    });

    it('should allow owner to revoke device and fail subsequent authentication', async () => {
      const res = await AgentDeviceService.revokeDevice(testUser1.id, pairedDeviceId);
      assert.strictEqual(res.success, true);

      // After revocation, authenticateDevice must return null
      const device = await AgentDeviceService.authenticateDevice(pairedToken);
      assert.strictEqual(device, null);
    });
  });

  describe('3. Socket.IO /agent Gateway Handshake & Pairing Flow', () => {
    it('should allow unauthenticated socket to pair via pairing:request event', async () => {
      const challenge = await AgentDeviceService.generateChallenge(testUser1);

      const clientSocket = Client(`http://127.0.0.1:${serverPort}/agent`, {
        auth: { token: '' },
        transports: ['websocket']
      });

      await new Promise((resolve) => clientSocket.on('connect', resolve));

      const pairingPromise = new Promise((resolve) => {
        clientSocket.on('pairing:response', (res) => resolve(res));
      });

      clientSocket.emit('pairing:request', {
        challengeCode: challenge.challengeCode,
        deviceId: 'dev_socket_paired_1',
        deviceName: 'Student Home PC',
        agentVersion: '1.0.0'
      });

      const result = await pairingPromise;
      assert.strictEqual(result.success, true);
      assert.ok(result.deviceToken);
      assert.strictEqual(result.userId, testUser1.id);

      clientSocket.disconnect();
    });

    it('should reject connection with invalid token', async () => {
      const clientSocket = Client(`http://127.0.0.1:${serverPort}/agent`, {
        auth: { token: 'bogus_token_xyz' },
        transports: ['websocket']
      });

      const errPromise = new Promise((resolve) => {
        clientSocket.on('connect_error', (err) => resolve(err.message));
      });

      const errMsg = await errPromise;
      assert.match(errMsg, /DEVICE_AUTHENTICATION_FAILED/i);
      clientSocket.disconnect();
    });

    it('should authenticate valid agent, process heartbeats, and track online state', async () => {
      // Create and pair a device
      const challenge = await AgentDeviceService.generateChallenge(testUser1);
      const pairRes = await AgentDeviceService.redeemChallenge(challenge.challengeCode, {
        deviceId: 'dev_online_test_1',
        deviceName: 'Workstation'
      });

      const clientSocket = Client(`http://127.0.0.1:${serverPort}/agent`, {
        auth: { token: pairRes.deviceToken },
        transports: ['websocket']
      });

      await new Promise((resolve) => clientSocket.on('connect', resolve));

      // Verify router registers device as online
      assert.strictEqual(AgentJobRouter.isDeviceConnected('dev_online_test_1'), true);
      const connected = AgentJobRouter.getConnectedDeviceForUser(testUser1.id);
      assert.ok(connected);
      assert.strictEqual(connected.deviceId, 'dev_online_test_1');

      // Send heartbeat
      const ackPromise = new Promise((resolve) => {
        clientSocket.on('heartbeat:ack', resolve);
      });

      clientSocket.emit('heartbeat', {
        protocolVersion: '1.0.0',
        deviceId: 'dev_online_test_1',
        agentVersion: '1.0.0',
        timestamp: Date.now(),
        compilers: { python: true, gcc: true }
      });

      const ack = await ackPromise;
      assert.strictEqual(ack.protocolVersion, '1.0.0');
      assert.ok(ack.serverTime > 0);

      clientSocket.disconnect();

      // Wait for disconnect propagation
      await new Promise(r => setTimeout(r, 50));
      assert.strictEqual(AgentJobRouter.isDeviceConnected('dev_online_test_1'), false);
    });
  });

  describe('4. Job Routing & Execution Correlation', () => {
    let clientSocket;
    let agentToken;
    let agentDeviceId = 'dev_runner_42';

    before(async () => {
      AgentDeviceService.clearRateLimits();
      const challenge = await AgentDeviceService.generateChallenge(testUser1);
      const pairRes = await AgentDeviceService.redeemChallenge(challenge.challengeCode, {
        deviceId: agentDeviceId,
        deviceName: 'Compile Runner PC'
      });
      agentToken = pairRes.deviceToken;

      clientSocket = Client(`http://127.0.0.1:${serverPort}/agent`, {
        auth: { token: agentToken },
        transports: ['websocket']
      });

      await new Promise((resolve) => clientSocket.on('connect', resolve));

      // Mock agent execution listener: receives job:dispatch and responds with job:result
      clientSocket.on('job:dispatch', (job) => {
        clientSocket.emit('job:result', {
          protocolVersion: '1.0.0',
          jobId: job.jobId,
          status: 'SUCCESS',
          verdict: 'Successful',
          stdout: `Hello from local compiler! (Processed ${job.sourceCode.length} bytes)`,
          stderr: '',
          exitCode: 0,
          executionTimeMs: 142,
          truncated: false,
          timestamp: Date.now()
        });
      });
    });

    after(() => {
      if (clientSocket) {
        clientSocket.disconnect();
        clientSocket.close();
      }
    });

    it('should dispatch Run job to connected agent and return correlated result', async () => {
      const jobId = `job_test_${Date.now()}`;
      const result = await AgentJobRouter.dispatchRunJob({
        userId: testUser1.id,
        deviceId: agentDeviceId,
        jobId,
        language: 'python',
        sourceCode: 'print("Hello from local compiler!")',
        stdin: ''
      });

      assert.strictEqual(result.verdict, 'Successful');
      assert.strictEqual(result.status, 'SUCCESS');
      assert.ok(result.output.includes('Hello from local compiler!'));
      assert.strictEqual(result.isLocalExecution, true);
    });

    it('should reject result for job ID assigned to another device', () => {
      // Simulate malicious device injecting result for someone else's job
      const fakeJobId = 'job_unauthorized_999';
      AgentJobRouter.pendingJobs.set(fakeJobId, {
        resolve: () => assert.fail('Should not resolve'),
        reject: () => {},
        timeoutTimer: setTimeout(() => {}, 10000),
        deviceId: 'real_owner_device',
        userId: 'some_user'
      });

      // Submit result from wrong device
      AgentJobRouter.handleJobResult('attacker_device', {
        jobId: fakeJobId,
        status: 'SUCCESS'
      });

      // Job should remain pending and not be resolved by attacker
      assert.ok(AgentJobRouter.pendingJobs.has(fakeJobId));
      clearTimeout(AgentJobRouter.pendingJobs.get(fakeJobId).timeoutTimer);
      AgentJobRouter.pendingJobs.delete(fakeJobId);
    });
  });

  describe('5. Installer Download Metadata & Delivery Routes', () => {
    it('should return valid published installer metadata with SHA-256 and version', async () => {
      const res = await fetch(`http://127.0.0.1:${serverPort}/api/agent/download-info`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.version, '1.0.0');
      assert.strictEqual(data.platform, 'win32-x64');
      assert.strictEqual(data.fileName, 'MUJCODE-Local-Compiler-Setup-1.0.0.exe');
      assert.strictEqual(data.fileSizeBytes, 92907917);
      assert.strictEqual(data.sha256, '49644B00B1891FD46A9F203A0D160CA94D0CA9B3866EDB804AB2DD45C2FB7197');
      assert.ok(data.downloadUrl.includes('MUJCODE-Local-Compiler-Setup-1.0.0.exe'));
      assert.deepStrictEqual(data.supportedLanguages, ['c', 'cpp', 'java', 'python', 'javascript', 'go', 'sql']);
    });

    it('should deliver installer via download stream (200) or redirect (302)', async () => {
      const res = await fetch(`http://127.0.0.1:${serverPort}/api/agent/download`, {
        redirect: 'manual'
      });
      assert.ok(res.status === 200 || res.status === 302, `Expected 200 or 302 but got ${res.status}`);
      if (res.status === 200) {
        assert.strictEqual(res.headers.get('content-type'), 'application/vnd.microsoft.portable-executable');
      } else {
        assert.ok(res.headers.get('location').includes('MUJCODE-Local-Compiler-Setup-1.0.0.exe'));
      }
    });
  });
});

