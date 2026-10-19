/**
 * MUJCODE Local Compiler — Secure Credential Storage
 * 
 * Manages encrypted device credentials using Electron safeStorage (OS DPAPI / Keychain).
 * Fails closed in production if hardware/OS encryption is unavailable.
 */

import fs from 'node:fs';
import { DeviceCredential, SafePairingStatus } from '../shared/agentProtocol.js';

export interface ICredentialStorage {
  storeCredential(credential: DeviceCredential): Promise<void>;
  getCredential(): Promise<DeviceCredential | null>;
  clearCredential(): Promise<void>;
  hasCredential(): Promise<boolean>;
  getSafeStatus(): Promise<SafePairingStatus>;
}

export class CredentialStorage implements ICredentialStorage {
  private isProduction: boolean;
  private storageFilePath: string | null = null;
  private inMemoryCredential: DeviceCredential | null = null;
  private safeStorageModule: any = null;

  constructor(isProduction: boolean = false, storageFilePath: string | null = null, safeStorageModule: any = null) {
    this.isProduction = isProduction;
    this.storageFilePath = storageFilePath;
    this.safeStorageModule = safeStorageModule;
    if (!this.safeStorageModule) {
      this.initSafeStorage();
    }
  }

  private initSafeStorage(): void {
    try {
      // Dynamic check for Electron safeStorage
      const electron = (globalThis as any).electron || null;
      if (electron?.safeStorage) {
        this.safeStorageModule = electron.safeStorage;
      } else {
        // In Node environment outside electron, attempt dynamic require or fallback
        try {
          const mod = require('electron');
          if (mod?.safeStorage) {
            this.safeStorageModule = mod.safeStorage;
          }
        } catch {}
      }
    } catch {}
  }

  private isEncryptionAvailable(): boolean {
    if (this.safeStorageModule && typeof this.safeStorageModule.isEncryptionAvailable === 'function') {
      return this.safeStorageModule.isEncryptionAvailable();
    }
    return false;
  }

  async storeCredential(credential: DeviceCredential): Promise<void> {
    if (!credential || !credential.deviceToken || !credential.deviceId) {
      throw new Error('Invalid credential: deviceToken and deviceId are required');
    }

    if (this.isEncryptionAvailable()) {
      try {
        const payload = JSON.stringify(credential);
        const encrypted = this.safeStorageModule.encryptString(payload);
        (this as any)._encryptedBuffer = encrypted;
        if (this.storageFilePath) {
          fs.writeFileSync(this.storageFilePath, encrypted);
        }
      } catch (err: any) {
        throw new Error(`Failed to encrypt device credential: ${err.message}`);
      }
    } else {
      if (this.isProduction) {
        // STRICT SAFETY: Fail closed in production if secure OS encryption is unavailable
        throw new Error(
          'Security Exception: OS hardware/credential encryption (DPAPI/Keychain) is unavailable. Storing credentials in plaintext is prohibited in production.'
        );
      }
      // Allowed in development / testing mode only
      this.inMemoryCredential = { ...credential };
    }
  }

  async getCredential(): Promise<DeviceCredential | null> {
    if (this.isEncryptionAvailable()) {
      try {
        let encrypted = (this as any)._encryptedBuffer;
        if (!encrypted && this.storageFilePath && fs.existsSync(this.storageFilePath)) {
          encrypted = fs.readFileSync(this.storageFilePath);
          (this as any)._encryptedBuffer = encrypted;
        }
        if (encrypted) {
          const decrypted = this.safeStorageModule.decryptString(encrypted);
          return JSON.parse(decrypted);
        }
      } catch {
        return null;
      }
    }

    if (this.inMemoryCredential) {
      return { ...this.inMemoryCredential };
    }

    return null;
  }

  async clearCredential(): Promise<void> {
    this.inMemoryCredential = null;
    delete (this as any)._encryptedBuffer;
    if (this.storageFilePath && fs.existsSync(this.storageFilePath)) {
      try {
        fs.unlinkSync(this.storageFilePath);
      } catch {}
    }
  }

  async hasCredential(): Promise<boolean> {
    const cred = await this.getCredential();
    return Boolean(cred && cred.deviceToken);
  }

  async getSafeStatus(): Promise<SafePairingStatus> {
    const cred = await this.getCredential();
    if (!cred) {
      return {
        isPaired: false,
        deviceId: null,
        userDisplayName: null,
        pairedAt: null,
        backendUrl: null
      };
    }

    return {
      isPaired: true,
      deviceId: cred.deviceId,
      userDisplayName: cred.userDisplayName || 'Student',
      pairedAt: cred.pairedAt,
      backendUrl: cred.backendUrl
    };
  }
}
