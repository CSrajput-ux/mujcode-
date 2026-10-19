/**
 * MUJCODE Local Compiler — UI State Transitions & IPC Regression Suite
 * 
 * Verifies:
 * 1. Connect click and connection-state transitions
 * 2. Pair Device success and failure handling
 * 3. Invalid or expired challenge codes
 * 4. Runtime scan success and failure handling
 * 5. IPC rejection and visible error handling
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { AgentConnectionService } from '../dist/networking/agentConnectionService.js';
import { AgentStateMachine } from '../dist/networking/agentState.js';
import { MockAgentTransport } from '../dist/networking/transport/mockTransport.js';
import { CredentialStorage } from '../dist/networking/credentialStorage.js';
import { PairingService } from '../dist/networking/pairingService.js';
import { runtimeDoctor } from '../dist/services/runtimeDoctor.js';
import { DEFAULT_DEV_CONFIG } from '../dist/networking/agentConfig.js';
import { IPC_CHANNELS } from '../dist/shared/ipcChannels.js';

describe('UI State Transitions & IPC Regression Suite', () => {
  let transport: MockAgentTransport;
  let credStorage: CredentialStorage;
  let pairingService: PairingService;
  let connService: AgentConnectionService;

  beforeEach(async () => {
    transport = new MockAgentTransport();
    credStorage = new CredentialStorage(false);
    await credStorage.clearCredential();
    pairingService = new PairingService(credStorage);
    connService = new AgentConnectionService(transport, DEFAULT_DEV_CONFIG, credStorage, pairingService);
  });

  describe('1. Connect Click & Connection-State Transitions', () => {
    it('should transition to PAIRING_REQUIRED when connect is clicked on an unpaired device', async () => {
      assert.strictEqual(connService.getState(), 'DISCONNECTED');
      const isPaired = await pairingService.isPaired();
      assert.strictEqual(isPaired, false);

      await connService.connect();
      assert.strictEqual(connService.getState(), 'PAIRING_REQUIRED');
    });

    it('should transition to CONNECTED when connect is clicked on a paired device', async () => {
      await credStorage.storeCredential({
        deviceId: 'dev_test_123',
        deviceToken: 'tok_valid_test_token',
        userId: 'usr_student_test',
        userDisplayName: 'Jane Doe',
        pairedAt: Date.now(),
        backendUrl: 'http://localhost:5000'
      });

      assert.strictEqual(await pairingService.isPaired(), true);

      await connService.connect();
      assert.strictEqual(connService.getState(), 'CONNECTED');

      // Test Disconnect
      await connService.disconnect();
      assert.strictEqual(connService.getState(), 'DISCONNECTED');
    });

    it('should ignore duplicate connect calls when already connected', async () => {
      await credStorage.storeCredential({
        deviceId: 'dev_test_123',
        deviceToken: 'tok_valid_test_token',
        userId: 'usr_student_test',
        userDisplayName: 'Jane Doe',
        pairedAt: Date.now(),
        backendUrl: 'http://localhost:5000'
      });

      await connService.connect();
      assert.strictEqual(connService.getState(), 'CONNECTED');

      // Second connect call should safely no-op
      await connService.connect();
      assert.strictEqual(connService.getState(), 'CONNECTED');
    });
  });

  describe('2. Pair Device Success and Failure', () => {
    it('should successfully redeem pairing challenge and store credential with userDisplayName', async () => {
      // Simulate backend auto-reply to pairing:request on mock transport
      transport.pairingResponder = (payload: any) => ({
        success: true,
        deviceId: payload.deviceId,
        deviceToken: 'tok_secret_device_bearer_token',
        userId: 'usr_student_42',
        userDisplayName: 'Jane Student'
      });

      const res = await connService.pairAndConnect('PAIR-A719E5A5', 'http://localhost:5000');
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.userDisplayName, 'Jane Student');

      // Confirm credential saved
      const cred = await credStorage.getCredential();
      assert.ok(cred);
      assert.strictEqual(cred?.userDisplayName, 'Jane Student');
      assert.strictEqual(cred?.userId, 'usr_student_42');

      // Device should now be connected
      assert.strictEqual(connService.getState(), 'CONNECTED');
    });

    it('should handle pairing rejection gracefully without crashing', async () => {
      transport.pairingResponder = () => ({
        success: false,
        error: 'Invalid or expired pairing code. Please generate a new code on the MUJCODE website.'
      });

      const res = await connService.pairAndConnect('PAIR-EXPIRED-CODE', 'http://localhost:5000');
      assert.strictEqual(res.success, false);
      assert.ok(res.error?.includes('Invalid or expired'));

      // Storage should remain empty
      assert.strictEqual(await credStorage.hasCredential(), false);
      assert.notStrictEqual(connService.getState(), 'CONNECTED');
    });
  });

  describe('3. Challenge Code Validation', () => {
    it('should validate challenge code formatting before making network requests', () => {
      // Empty or missing
      assert.strictEqual(pairingService.validateChallengeCode('').valid, false);
      // Too short (< 6 chars)
      assert.strictEqual(pairingService.validateChallengeCode('PAIR').valid, false);
      // Contains invalid special characters
      assert.strictEqual(pairingService.validateChallengeCode('PAIR-A719!@#$').valid, false);
      // Valid formats
      assert.strictEqual(pairingService.validateChallengeCode('PAIR-A719E5A5').valid, true);
      assert.strictEqual(pairingService.validateChallengeCode('code_123456').valid, true);
    });
  });

  describe('4. Runtime Scan Success and Failure Handling', () => {
    it('should diagnose all 7 supported toolchains without throwing', async () => {
      const diagnostics = await runtimeDoctor.diagnoseAll();
      assert.strictEqual(Array.isArray(diagnostics), true);
      assert.strictEqual(diagnostics.length, 7);

      const keys = diagnostics.map(d => d.languageKey);
      assert.ok(keys.includes('c'));
      assert.ok(keys.includes('cpp'));
      assert.ok(keys.includes('java'));
      assert.ok(keys.includes('python'));
      assert.ok(keys.includes('javascript'));
      assert.ok(keys.includes('go'));
      assert.ok(keys.includes('sql'));

      // SQL should be ready via in-process SQLite engine
      const sqlDiag = diagnostics.find(d => d.languageKey === 'sql');
      assert.ok(sqlDiag);
      assert.strictEqual(sqlDiag?.available, true);
    });

    it('should provide troubleshooting instructions for any missing runtime', async () => {
      const diagnostics = await runtimeDoctor.diagnoseAll();
      for (const d of diagnostics) {
        if (!d.available) {
          assert.ok(d.troubleshootingInstructions, `Missing runtime ${d.runtimeName} should provide troubleshooting instructions`);
          assert.strictEqual(d.executablePath, null);
        }
      }
    });
  });

  describe('5. IPC Channel Integrity', () => {
    it('should ensure all required IPC channels are uniquely defined', () => {
      const values = Object.values(IPC_CHANNELS);
      const uniqueValues = new Set(values);
      assert.strictEqual(values.length, uniqueValues.size, 'IPC channel strings must be unique');

      assert.ok(values.includes('compiler:execute-code'));
      assert.ok(values.includes('doctor:get-diagnostics'));
      assert.ok(values.includes('compiler:get-languages'));
      assert.ok(values.includes('system:open-external'));
      assert.ok(values.includes('agent:connect'));
      assert.ok(values.includes('agent:disconnect'));
      assert.ok(values.includes('agent:submit-pairing-code'));
      assert.ok(values.includes('agent:unpair'));
    });
  });

  describe('6. Production Diagnostic & Error Classification', () => {
    it('should probe backend reachability on local server', async () => {
      const { SocketIoAgentTransport } = await import('../dist/networking/transport/socketIoTransport.js');
      const transport = new SocketIoAgentTransport();
      const probe = await transport.probeBackendReachability('http://localhost:5000', 3000);
      assert.strictEqual(probe.reachable, true);
    });

    it('should detect offline backend on unused port', async () => {
      const { SocketIoAgentTransport } = await import('../dist/networking/transport/socketIoTransport.js');
      const transport = new SocketIoAgentTransport();
      const probe = await transport.probeBackendReachability('http://127.0.0.1:59999', 1000);
      assert.strictEqual(probe.reachable, false);
      assert.ok(probe.error);
    });
  });
});
