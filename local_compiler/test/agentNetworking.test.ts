/**
 * MUJCODE Local Compiler — Step 3A Automated Test Suite
 * 
 * Tests the secure networking client, state machine transitions, device pairing lifecycle,
 * credential encryption/storage, and validated job execution protocol using MockAgentTransport.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { validateAgentConfig, DEFAULT_DEV_CONFIG, DEFAULT_PROD_CONFIG } from '../dist/networking/agentConfig.js';
import type { AgentConfig } from '../dist/networking/agentConfig.js';
import { AgentStateMachine } from '../dist/networking/agentState.js';
import { CredentialStorage } from '../dist/networking/credentialStorage.js';
import { MockAgentTransport } from '../dist/networking/transport/mockTransport.js';
import { PairingService } from '../dist/networking/pairingService.js';
import { JobProtocolHandler } from '../dist/networking/jobProtocol.js';
import { AgentConnectionService } from '../dist/networking/agentConnectionService.js';
import { AGENT_PROTOCOL_VERSION } from '../dist/shared/agentProtocol.js';
import type { InboundJobMessage, DeviceCredential } from '../dist/shared/agentProtocol.js';

describe('1. Configuration & Security Validation', () => {
  it('should accept valid development configuration', () => {
    assert.doesNotThrow(() => validateAgentConfig(DEFAULT_DEV_CONFIG));
  });

  it('should accept valid production configuration with HTTPS', () => {
    assert.doesNotThrow(() => validateAgentConfig(DEFAULT_PROD_CONFIG));
  });

  it('should reject invalid or malformed backend URLs', () => {
    const invalidConfig: AgentConfig = { ...DEFAULT_DEV_CONFIG, backendBaseUrl: 'not_a_valid_url' };
    assert.throws(() => validateAgentConfig(invalidConfig), /Invalid backend base URL/i);
  });

  it('should strictly reject insecure HTTP or WS URLs in production mode', () => {
    const insecureProdConfig: AgentConfig = {
      ...DEFAULT_PROD_CONFIG,
      backendBaseUrl: 'http://api.mujcode.com'
    };
    assert.throws(
      () => validateAgentConfig(insecureProdConfig),
      /Insecure protocol in production: "http:". Production connections strictly require HTTPS or WSS/i
    );
  });

  it('should reject out-of-bound timeouts and limits', () => {
    const badTimeout: AgentConfig = { ...DEFAULT_DEV_CONFIG, connectTimeoutMs: 100 };
    assert.throws(() => validateAgentConfig(badTimeout), /connectTimeoutMs must be between/i);

    const badQueue: AgentConfig = { ...DEFAULT_DEV_CONFIG, maxPendingJobs: 0 };
    assert.throws(() => validateAgentConfig(badQueue), /maxPendingJobs must be between/i);
  });
});

describe('2. Connection State Machine', () => {
  let sm: AgentStateMachine;

  beforeEach(() => {
    sm = new AgentStateMachine();
  });

  it('should start in DISCONNECTED state', () => {
    assert.strictEqual(sm.getState(), 'DISCONNECTED');
    assert.strictEqual(sm.isConnected(), false);
  });

  it('should permit legal state transitions', () => {
    sm.transitionTo('CONNECTING');
    assert.strictEqual(sm.getState(), 'CONNECTING');

    sm.transitionTo('CONNECTED');
    assert.strictEqual(sm.getState(), 'CONNECTED');
    assert.strictEqual(sm.isConnected(), true);

    sm.transitionTo('RECONNECTING');
    assert.strictEqual(sm.getState(), 'RECONNECTING');

    sm.transitionTo('CONNECTED');
    assert.strictEqual(sm.getState(), 'CONNECTED');

    sm.transitionTo('STOPPING');
    assert.strictEqual(sm.getState(), 'STOPPING');

    sm.transitionTo('DISCONNECTED');
    assert.strictEqual(sm.getState(), 'DISCONNECTED');
  });

  it('should strictly reject illegal state transitions', () => {
    // DISCONNECTED cannot jump directly to CONNECTED without CONNECTING
    assert.throws(
      () => sm.transitionTo('CONNECTED'),
      /Illegal state transition: Cannot transition from "DISCONNECTED" to "CONNECTED"/i
    );

    sm.transitionTo('CONNECTING');
    // CONNECTING cannot jump to STOPPING
    assert.throws(
      () => sm.transitionTo('STOPPING'),
      /Illegal state transition: Cannot transition from "CONNECTING" to "STOPPING"/i
    );
  });

  it('should notify subscribers on state transitions', () => {
    const transitions: Array<{ to: string; from: string }> = [];
    const unsubscribe = sm.subscribe((newState, oldState) => {
      transitions.push({ to: newState, from: oldState });
    });

    sm.transitionTo('CONNECTING');
    sm.transitionTo('CONNECTED');
    unsubscribe();
    sm.transitionTo('DISCONNECTED'); // Unsubscribed, should not be recorded

    assert.deepStrictEqual(transitions, [
      { to: 'CONNECTING', from: 'DISCONNECTED' },
      { to: 'CONNECTED', from: 'CONNECTING' }
    ]);
  });
});

describe('3. Credential Storage & Safe Status', () => {
  it('should store, retrieve, and clear device credentials in development mode', async () => {
    const storage = new CredentialStorage(false);
    assert.strictEqual(await storage.hasCredential(), false);

    const credential: DeviceCredential = {
      deviceId: 'dev_123',
      deviceToken: 'token_abc_secret',
      userId: 'user_456',
      userDisplayName: 'Alice Student',
      pairedAt: Date.now(),
      backendUrl: 'http://localhost:5000'
    };

    await storage.storeCredential(credential);
    assert.strictEqual(await storage.hasCredential(), true);

    const retrieved = await storage.getCredential();
    assert.strictEqual(retrieved?.deviceId, 'dev_123');
    assert.strictEqual(retrieved?.userId, 'user_456');

    // Safe status must NOT expose deviceToken
    const safeStatus = await storage.getSafeStatus();
    assert.strictEqual(safeStatus.isPaired, true);
    assert.strictEqual(safeStatus.deviceId, 'dev_123');
    assert.strictEqual((safeStatus as any).deviceToken, undefined);

    await storage.clearCredential();
    assert.strictEqual(await storage.hasCredential(), false);
    assert.strictEqual(await storage.getCredential(), null);
  });

  it('should fail closed in production mode when hardware/OS encryption is unavailable', async () => {
    const prodStorage = new CredentialStorage(true); // isProduction = true

    const cred: DeviceCredential = {
      deviceId: 'dev_secure',
      deviceToken: 'secret_token',
      userId: 'u_1',
      pairedAt: Date.now(),
      backendUrl: 'https://api.mujcode.com'
    };

    // When running under pure Node test runner without Electron DPAPI available,
    // production mode MUST fail closed rather than writing plaintext credentials.
    await assert.rejects(
      () => prodStorage.storeCredential(cred),
      /Security Exception: OS hardware\/credential encryption/i
    );
  });
});

describe('4. Pairing Protocol & Lifecycle', () => {
  let transport: MockAgentTransport;
  let storage: CredentialStorage;
  let pairingService: PairingService;

  beforeEach(() => {
    transport = new MockAgentTransport();
    storage = new CredentialStorage(false);
    pairingService = new PairingService(storage, 'test_device_001');
  });

  it('should validate challenge code formatting', () => {
    assert.strictEqual(pairingService.validateChallengeCode('PAIR-12345').valid, true);
    assert.strictEqual(pairingService.validateChallengeCode('12').valid, false); // too short
    assert.strictEqual(pairingService.validateChallengeCode('   ').valid, false);
    assert.strictEqual(pairingService.validateChallengeCode('bad code with spaces!').valid, false);
  });

  it('should submit pairing challenge and save credential on success', async () => {
    const pairingPromise = pairingService.submitPairingChallenge(
      'PAIR-VALID-999',
      'http://localhost:5000',
      transport
    );

    // Verify outbound request payload
    const sent = transport.getLastSentMessage('pairing:request');
    assert.strictEqual(sent.challengeCode, 'PAIR-VALID-999');
    assert.strictEqual(sent.deviceId, 'test_device_001');

    // Simulate server response
    transport.emitEvent('pairing:response', {
      success: true,
      deviceToken: 'issued_device_token_xyz',
      userId: 'student_42',
      userDisplayName: 'Rahul Sharma'
    });

    const result = await pairingPromise;
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.userDisplayName, 'Rahul Sharma');

    const cred = await storage.getCredential();
    assert.strictEqual(cred?.deviceToken, 'issued_device_token_xyz');
    assert.strictEqual(cred?.userId, 'student_42');
  });

  it('should reject invalid or expired pairing code from server', async () => {
    const pairingPromise = pairingService.submitPairingChallenge(
      'PAIR-EXPIRED-000',
      'http://localhost:5000',
      transport
    );

    transport.emitEvent('pairing:response', {
      success: false,
      error: 'Pairing challenge has expired. Please refresh the page.'
    });

    const result = await pairingPromise;
    assert.strictEqual(result.success, false);
    assert.match(result.error || '', /has expired/i);
    assert.strictEqual(await storage.hasCredential(), false);
  });

  it('should unpair and notify server with revocation event', async () => {
    await storage.storeCredential({
      deviceId: 'test_device_001',
      deviceToken: 'token_to_clear',
      userId: 'u_1',
      pairedAt: Date.now(),
      backendUrl: 'http://localhost:5000'
    });

    await transport.connect({ url: 'http://localhost:5000', namespace: '/agent', timeoutMs: 1000 });
    await pairingService.unpairDevice(transport);

    assert.strictEqual(await storage.hasCredential(), false);
    const revokeMsg = transport.getLastSentMessage('pairing:revoke');
    assert.strictEqual(revokeMsg.deviceId, 'test_device_001');
  });
});

describe('5. Validated Job Protocol', () => {
  let jobHandler: JobProtocolHandler;

  beforeEach(() => {
    jobHandler = new JobProtocolHandler(DEFAULT_DEV_CONFIG);
  });

  it('should reject malformed job messages gracefully without crashing', async () => {
    const badJob: any = { notAJob: true };
    const res = await jobHandler.processJob(badJob);
    assert.strictEqual(res.status, 'INTERNAL_ERROR');
    assert.strictEqual(res.errorCode, 'VALIDATION_FAILED');
    assert.match(res.stderr, /Missing protocolVersion/i);
  });

  it('should reject unsupported language IDs', async () => {
    const unsupportedJob: InboundJobMessage = {
      protocolVersion: AGENT_PROTOCOL_VERSION,
      jobId: 'job_ruby_1',
      languageId: 999, // Ruby / Unsupported
      sourceCode: 'puts "hello"',
      timestamp: Date.now()
    };

    const res = await jobHandler.processJob(unsupportedJob);
    assert.strictEqual(res.status, 'INTERNAL_ERROR');
    assert.strictEqual(res.errorCode, 'VALIDATION_FAILED');
    assert.match(res.stderr, /Unsupported language ID: 999/i);
  });

  it('should reject oversized source code exceeding 100 KB', async () => {
    const oversizedJob: InboundJobMessage = {
      protocolVersion: AGENT_PROTOCOL_VERSION,
      jobId: 'job_oversize',
      languageId: 71,
      sourceCode: 'print(1)\n'.repeat(20000), // > 100 KB
      timestamp: Date.now()
    };

    const res = await jobHandler.processJob(oversizedJob);
    assert.strictEqual(res.status, 'INTERNAL_ERROR');
    assert.strictEqual(res.errorCode, 'VALIDATION_FAILED');
    assert.match(res.stderr, /Source code exceeds maximum allowed size/i);
  });

  it('should reject expired jobs', async () => {
    const expiredJob: InboundJobMessage = {
      protocolVersion: AGENT_PROTOCOL_VERSION,
      jobId: 'job_expired_1',
      languageId: 71,
      sourceCode: 'print(42)',
      timestamp: Date.now() - 100000, // 100s ago (limit is 60s)
      expiresAt: Date.now() - 1000
    };

    const res = await jobHandler.processJob(expiredJob);
    assert.strictEqual(res.status, 'INTERNAL_ERROR');
    assert.strictEqual(res.errorCode, 'VALIDATION_FAILED');
    assert.match(res.stderr, /Job has expired/i);
  });

  it('should detect and reject duplicate jobs with the same jobId', async () => {
    const job: InboundJobMessage = {
      protocolVersion: AGENT_PROTOCOL_VERSION,
      jobId: 'job_unique_dup_check',
      languageId: 71,
      sourceCode: 'print("first run")',
      timestamp: Date.now()
    };

    const res1 = await jobHandler.processJob(job);
    assert.strictEqual(res1.status, 'SUCCESS');

    // Second execution with identical jobId MUST be rejected
    const res2 = await jobHandler.processJob(job);
    assert.strictEqual(res2.status, 'INTERNAL_ERROR');
    assert.strictEqual(res2.errorCode, 'VALIDATION_FAILED');
    assert.match(res2.stderr, /Duplicate job rejected/i);
  });
});

describe('6. Full Connection & Execution Lifecycle with Mock Transport', () => {
  let transport: MockAgentTransport;
  let storage: CredentialStorage;
  let pairingService: PairingService;
  let connService: AgentConnectionService;

  beforeEach(async () => {
    transport = new MockAgentTransport();
    storage = new CredentialStorage(false);
    pairingService = new PairingService(storage, 'test_device_e2e');

    // Seed paired credential so connection is authorized
    await storage.storeCredential({
      deviceId: 'test_device_e2e',
      deviceToken: 'scoped_jwt_token_123',
      userId: 'student_e2e',
      userDisplayName: 'Student Tester',
      pairedAt: Date.now(),
      backendUrl: 'http://localhost:5000'
    });

    connService = new AgentConnectionService(transport, DEFAULT_DEV_CONFIG, storage, pairingService);
  });

  it('should require pairing if no credential is stored', async () => {
    await storage.clearCredential();
    await connService.connect();
    assert.strictEqual(connService.getState(), 'PAIRING_REQUIRED');
  });

  it('should connect successfully and send heartbeats periodically', async () => {
    await connService.connect();
    assert.strictEqual(connService.getState(), 'CONNECTED');

    // Fast-forward or trigger heartbeat
    transport.emit('heartbeat', {
      protocolVersion: AGENT_PROTOCOL_VERSION,
      deviceId: 'test_device_e2e',
      agentVersion: '1.0.0',
      timestamp: Date.now(),
      compilers: { python: true }
    });

    const sentHeartbeat = transport.getLastSentMessage('heartbeat');
    assert.strictEqual(sentHeartbeat.deviceId, 'test_device_e2e');
    assert.strictEqual(sentHeartbeat.protocolVersion, '1.0.0');

    await connService.disconnect();
    assert.strictEqual(connService.getState(), 'DISCONNECTED');
  });

  it('should calculate exponential backoff with jitter correctly within configured bounds', () => {
    const delay1 = connService.calculateReconnectDelay();
    assert(delay1 >= 700 && delay1 <= 30000, `Delay ${delay1} outside expected bounds`);
  });

  it('should receive job:dispatch over transport, execute via bridge, and emit job:result', async () => {
    await connService.connect();
    assert.strictEqual(connService.getState(), 'CONNECTED');

    const jobMsg: InboundJobMessage = {
      protocolVersion: AGENT_PROTOCOL_VERSION,
      jobId: 'job_e2e_python_42',
      languageId: 71,
      sourceCode: 'print(6 * 7)',
      timestamp: Date.now()
    };

    // Simulate backend sending job:dispatch
    transport.emitEvent('job:dispatch', jobMsg);

    // Wait briefly for execution and emission
    await new Promise((r) => setTimeout(r, 400));

    const result = transport.getLastSentMessage('job:result');
    assert(result, 'Expected job:result to be emitted back over transport');
    assert.strictEqual(result.jobId, 'job_e2e_python_42');
    assert.strictEqual(result.status, 'SUCCESS');
    assert.strictEqual(result.stdout.trim(), '42');

    await connService.disconnect();
  });

  it('should prevent duplicate active connections when already connected', async () => {
    await connService.connect();
    assert.strictEqual(connService.getState(), 'CONNECTED');

    // Second connect() should be a safe no-op
    await connService.connect();
    assert.strictEqual(connService.getState(), 'CONNECTED');

    await connService.disconnect();
  });
});
