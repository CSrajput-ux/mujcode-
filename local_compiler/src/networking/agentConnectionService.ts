/**
 * MUJCODE Local Compiler — Agent Connection Service
 * 
 * Orchestrates connection lifecycle, state transitions, exponential backoff with jitter,
 * heartbeat monitoring, stale-connection detection, and execution job routing.
 */

import { AgentConfig, validateAgentConfig, DEFAULT_DEV_CONFIG } from './agentConfig.js';
import { AgentStateMachine } from './agentState.js';
import { IAgentTransport } from './transport/transportInterface.js';
import { ICredentialStorage, CredentialStorage } from './credentialStorage.js';
import { PairingService } from './pairingService.js';
import { JobProtocolHandler } from './jobProtocol.js';
import { runtimeDoctor } from '../services/runtimeDoctor.js';
import {
  AgentConnectionStatus,
  InboundJobMessage,
  HeartbeatPayload,
  HeartbeatAckPayload,
  AGENT_PROTOCOL_VERSION
} from '../shared/agentProtocol.js';

export class AgentConnectionService {
  private config: AgentConfig;
  private stateMachine: AgentStateMachine;
  private transport: IAgentTransport;
  private credentialStorage: ICredentialStorage;
  private pairingService: PairingService;
  private jobProtocolHandler: JobProtocolHandler;

  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private lastServerAck: number = 0;
  private isExplicitlyStopped: boolean = false;
  private isPairing: boolean = false;

  constructor(
    transport: IAgentTransport,
    config: AgentConfig = DEFAULT_DEV_CONFIG,
    credentialStorage?: ICredentialStorage,
    pairingService?: PairingService
  ) {
    validateAgentConfig(config);
    this.config = config;
    this.transport = transport;
    this.stateMachine = new AgentStateMachine();
    this.credentialStorage = credentialStorage || new CredentialStorage(config.isProduction);
    this.pairingService = pairingService || new PairingService(this.credentialStorage);
    this.jobProtocolHandler = new JobProtocolHandler(config);

    this.setupTransportListeners();
  }

  getState(): AgentConnectionStatus {
    return this.stateMachine.getState();
  }

  getStateMachine(): AgentStateMachine {
    return this.stateMachine;
  }

  getConfig(): AgentConfig {
    return this.config;
  }

  getPairingService(): PairingService {
    return this.pairingService;
  }

  getJobProtocolHandler(): JobProtocolHandler {
    return this.jobProtocolHandler;
  }

  getTransport(): IAgentTransport {
    return this.transport;
  }

  /**
   * Set up transport event listeners.
   */
  private setupTransportListeners(): void {
    this.transport.on('connect', () => {
      if (this.isPairing) {
        return; // Pairing socket connected, do not start heartbeats or transition state machine
      }
      this.reconnectAttempts = 0;
      this.lastServerAck = Date.now();
      this.stateMachine.transitionTo('CONNECTED');
      this.startHeartbeat();
    });

    this.transport.on('disconnect', (reason: string) => {
      if (this.isPairing) {
        return; // Pairing socket disconnected, do not trigger reconnect
      }
      this.stopHeartbeat();
      if (this.stateMachine.getState() === 'STOPPING') {
        this.stateMachine.transitionTo('DISCONNECTED');
        return;
      }

      if (!this.isExplicitlyStopped) {
        try {
          this.stateMachine.transitionTo('RECONNECTING', `Disconnected: ${reason}`);
          this.scheduleReconnect();
        } catch {
          this.stateMachine.transitionTo('DISCONNECTED');
        }
      } else {
        this.stateMachine.transitionTo('DISCONNECTED');
      }
    });

    this.transport.on('error', (err: any) => {
      const errMsg = err?.message || String(err);
      this.stopHeartbeat();
      if (!this.isExplicitlyStopped && this.stateMachine.canTransitionTo('ERROR')) {
        this.stateMachine.transitionTo('ERROR', errMsg);
        this.scheduleReconnect();
      }
    });

    this.transport.on('heartbeat:ack', (_ack: HeartbeatAckPayload) => {
      this.lastServerAck = Date.now();
    });

    // Inbound Execution Job Listener
    this.transport.on('job:dispatch', async (job: InboundJobMessage) => {
      if (!this.stateMachine.isConnected()) {
        console.warn('[AgentConnectionService] Dropped job received while not in CONNECTED state');
        return;
      }

      try {
        const result = await this.jobProtocolHandler.processJob(job);
        this.transport.emit('job:result', result);
      } catch (err: any) {
        console.error('[AgentConnectionService] Unhandled job execution error:', err);
      }
    });
  }

  /**
   * Calculate exponential backoff with random jitter.
   */
  calculateReconnectDelay(): number {
    const { initialReconnectDelayMs, maxReconnectDelayMs, reconnectJitterFactor } = this.config;
    const baseDelay = Math.min(
      maxReconnectDelayMs,
      initialReconnectDelayMs * Math.pow(2, this.reconnectAttempts)
    );
    const jitter = (Math.random() * 2 - 1) * reconnectJitterFactor; // -jitterFactor to +jitterFactor
    const calculated = Math.round(baseDelay * (1 + jitter));
    return Math.max(initialReconnectDelayMs, Math.min(maxReconnectDelayMs, calculated));
  }

  private scheduleReconnect(): void {
    if (this.isExplicitlyStopped) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    this.reconnectAttempts++;
    const delay = this.calculateReconnectDelay();

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {});
    }, delay);
  }

  /**
   * Start periodic heartbeat ping & stale-connection monitor.
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.lastServerAck = Date.now();

    this.heartbeatTimer = setInterval(async () => {
      if (!this.stateMachine.isConnected()) {
        this.stopHeartbeat();
        return;
      }

      // Check stale server acknowledgement
      const timeSinceLastAck = Date.now() - this.lastServerAck;
      if (timeSinceLastAck > this.config.heartbeatTimeoutMs) {
        console.warn(`[AgentConnectionService] Heartbeat timeout: no ack received for ${timeSinceLastAck}ms. Triggering reconnect.`);
        await this.transport.disconnect('heartbeat_timeout');
        return;
      }

      // Collect compiler health for heartbeat payload
      const compilersMap: Record<string, boolean> = {};
      try {
        const diagnostics = await runtimeDoctor.diagnoseAll();
        for (const d of diagnostics) {
          compilersMap[d.languageKey] = d.available;
        }
      } catch {}

      const ping: HeartbeatPayload = {
        protocolVersion: AGENT_PROTOCOL_VERSION,
        deviceId: this.pairingService.getDeviceId(),
        agentVersion: this.config.agentVersion,
        timestamp: Date.now(),
        compilers: compilersMap
      };

      this.transport.emit('heartbeat', ping);
    }, this.config.heartbeatIntervalMs);

    if (this.heartbeatTimer.unref) this.heartbeatTimer.unref();
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Initiate outbound connection to the backend.
   */
  async connect(): Promise<void> {
    if (this.stateMachine.isConnected()) {
      return; // Prevent duplicate active connections
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.isExplicitlyStopped = false;

    // Check device credential
    const isPaired = await this.pairingService.isPaired();
    if (!isPaired) {
      this.stateMachine.transitionTo('PAIRING_REQUIRED');
      return;
    }

    const credential = await this.credentialStorage.getCredential();
    if (!credential || !credential.deviceToken) {
      this.stateMachine.transitionTo('PAIRING_REQUIRED');
      return;
    }

    try {
      this.stateMachine.transitionTo('CONNECTING');
      await this.transport.connect({
        url: credential.backendUrl || this.config.backendBaseUrl,
        namespace: this.config.agentNamespace,
        deviceToken: credential.deviceToken,
        timeoutMs: this.config.connectTimeoutMs
      });
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      if (errMsg.includes('DEVICE_AUTHENTICATION_FAILED') || errMsg.includes('authentication')) {
        if (this.stateMachine.canTransitionTo('PAIRING_REQUIRED')) {
          this.stateMachine.transitionTo('PAIRING_REQUIRED', 'Device token expired or revoked');
        }
      } else {
        if (this.stateMachine.canTransitionTo('ERROR')) {
          this.stateMachine.transitionTo('ERROR', errMsg);
        }
        if (!errMsg.includes('namespace')) {
          this.scheduleReconnect();
        }
      }
      throw err;
    }
  }

  /**
   * Graceful disconnection.
   */
  async disconnect(): Promise<void> {
    this.isExplicitlyStopped = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();

    if (this.stateMachine.canTransitionTo('STOPPING')) {
      this.stateMachine.transitionTo('STOPPING');
    }
    await this.transport.disconnect('client_shutdown');
    if (this.stateMachine.canTransitionTo('DISCONNECTED')) {
      this.stateMachine.transitionTo('DISCONNECTED');
    }
  }

  /**
   * Submit pairing challenge code and immediately connect if successful.
   */
  async pairAndConnect(challengeCode: string, backendUrl?: string): Promise<{ success: boolean; userDisplayName?: string; error?: string }> {
    const targetUrl = backendUrl || this.config.backendBaseUrl;
    this.isPairing = true;

    try {
      if (this.transport.isConnected()) {
        try {
          await this.transport.disconnect('pairing_init');
        } catch {}
      }

      let lastError: any = null;
      const maxAttempts = 2;
      let connected = false;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          if (attempt > 1) {
            console.log(`[AgentConnectionService] Retry attempt ${attempt}/${maxAttempts} connecting to ${targetUrl}...`);
            await new Promise((r) => setTimeout(r, 1500));
          }

          await this.transport.connect({
            url: targetUrl,
            namespace: this.config.agentNamespace,
            deviceToken: '',
            timeoutMs: this.config.connectTimeoutMs
          });
          connected = true;
          break;
        } catch (err: any) {
          lastError = err;
          const msg = err?.message || String(err);
          // Do not retry on non-transient configuration or namespace errors
          if (msg.includes('namespace') || msg.includes('Unsupported URL') || msg.includes('Invalid URL')) {
            break;
          }
        }
      }

      if (!connected) {
        return { success: false, error: lastError?.message || `Failed to reach backend at ${targetUrl}` };
      }

      const res = await this.pairingService.submitPairingChallenge(challengeCode, targetUrl, this.transport);

      if (res.success) {
        // Disconnect temporary unauthenticated pairing socket and reconnect with authenticated deviceToken
        try {
          await this.transport.disconnect('pairing_completed');
        } catch {}
        this.isPairing = false;
        await this.connect();
        return { success: true, userDisplayName: res.userDisplayName };
      }
      return { success: false, error: res.error };
    } finally {
      this.isPairing = false;
    }
  }

  /**
   * Unpair and disconnect.
   */
  async unpair(): Promise<void> {
    await this.disconnect();
    await this.pairingService.unpairDevice(this.transport);
    this.stateMachine.transitionTo('PAIRING_REQUIRED');
  }
}
