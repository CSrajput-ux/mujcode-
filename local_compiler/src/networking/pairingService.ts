/**
 * MUJCODE Local Compiler — Device Pairing Service
 * 
 * Manages the student device pairing lifecycle, challenge redemption,
 * and scoped credential persistence.
 */

import crypto from 'node:crypto';
import os from 'node:os';
import {
  PairingRequestPayload,
  DeviceCredential,
  SafePairingStatus,
  AGENT_PROTOCOL_VERSION
} from '../shared/agentProtocol.js';
import { ICredentialStorage } from './credentialStorage.js';
import { IAgentTransport } from './transport/transportInterface.js';

export class PairingService {
  private credentialStorage: ICredentialStorage;
  private deviceId: string;
  private deviceName: string;

  constructor(credentialStorage: ICredentialStorage, deviceId?: string) {
    this.credentialStorage = credentialStorage;
    this.deviceId = deviceId || crypto.randomUUID();
    this.deviceName = `${os.hostname()} (${os.platform()} ${os.arch()})`;
  }

  getDeviceId(): string {
    return this.deviceId;
  }

  getDeviceName(): string {
    return this.deviceName;
  }

  /**
   * Validate a pairing challenge code format (must be 6-64 chars alphanumeric)
   */
  validateChallengeCode(code: string): { valid: boolean; reason?: string } {
    if (!code || typeof code !== 'string') {
      return { valid: false, reason: 'Pairing code is required' };
    }
    const clean = code.trim();
    if (clean.length < 6 || clean.length > 64) {
      return { valid: false, reason: 'Pairing code must be between 6 and 64 characters' };
    }
    if (!/^[a-zA-Z0-9_\-]+$/.test(clean)) {
      return { valid: false, reason: 'Pairing code contains invalid characters' };
    }
    return { valid: true };
  }

  /**
   * Submit pairing request over transport and wait for authenticated backend response.
   */
  async submitPairingChallenge(
    challengeCode: string,
    backendUrl: string,
    transport: IAgentTransport,
    timeoutMs: number = 10000
  ): Promise<{ success: boolean; userDisplayName?: string; error?: string }> {
    const val = this.validateChallengeCode(challengeCode);
    if (!val.valid) {
      return { success: false, error: val.reason };
    }

    const payload: PairingRequestPayload = {
      protocolVersion: AGENT_PROTOCOL_VERSION,
      challengeCode: challengeCode.trim(),
      deviceId: this.deviceId,
      deviceName: this.deviceName,
      agentVersion: '1.0.0',
      timestamp: Date.now()
    };

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        cleanup();
        resolve({ success: false, error: 'Pairing request timed out. Please verify your internet connection and try again.' });
      }, timeoutMs);

      const responseHandler = async (res: any) => {
        cleanup();
        if (res && res.success && res.deviceToken && res.userId) {
          const credential: DeviceCredential = {
            deviceId: this.deviceId,
            deviceToken: res.deviceToken,
            userId: res.userId,
            userDisplayName: res.userDisplayName || 'Student',
            pairedAt: Date.now(),
            backendUrl
          };

          try {
            await this.credentialStorage.storeCredential(credential);
            resolve({ success: true, userDisplayName: credential.userDisplayName });
          } catch (err: any) {
            resolve({ success: false, error: `Failed to save credential securely: ${err.message}` });
          }
        } else {
          resolve({
            success: false,
            error: res?.error || 'Invalid or expired pairing code. Please generate a fresh code on the MUJCODE website.'
          });
        }
      };

      const cleanup = () => {
        clearTimeout(timer);
        transport.off('pairing:response', responseHandler);
      };

      transport.on('pairing:response', responseHandler);
      transport.emit('pairing:request', payload);
    });
  }

  /**
   * Unpair the device, revoke credential, and clear local encrypted storage.
   */
  async unpairDevice(transport?: IAgentTransport): Promise<void> {
    if (transport && transport.isConnected()) {
      try {
        transport.emit('pairing:revoke', {
          protocolVersion: AGENT_PROTOCOL_VERSION,
          deviceId: this.deviceId,
          timestamp: Date.now()
        });
      } catch {}
    }

    await this.credentialStorage.clearCredential();
  }

  async isPaired(): Promise<boolean> {
    return this.credentialStorage.hasCredential();
  }

  async getSafeStatus(): Promise<SafePairingStatus> {
    return this.credentialStorage.getSafeStatus();
  }
}
