/**
 * MUJCODE Local Compiler — Socket.IO Client Transport
 * 
 * Production transport connecting to the MUJCODE cloud backend (/agent namespace)
 * using outbound TLS (WSS) and scoped device token authentication.
 */

import { IAgentTransport, TransportConnectOptions } from './transportInterface.js';

export class SocketIoAgentTransport implements IAgentTransport {
  private socket: any = null;
  private connected: boolean = false;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  getTransportType(): 'socket.io' {
    return 'socket.io';
  }

  /**
   * Fast pre-flight HTTP probe to distinguish offline, cold-start/sleeping, and online servers.
   */
  async probeBackendReachability(
    url: string,
    timeoutMs: number = 8000
  ): Promise<{ reachable: boolean; isSleeping?: boolean; error?: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const probeUrl = `${url.replace(/\/+$/, '')}/socket.io/?EIO=4&transport=polling`;
      const res = await fetch(probeUrl, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res.ok) {
        return { reachable: true, isSleeping: false };
      }
      return { reachable: true, error: `HTTP ${res.status}` };
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        return { reachable: false, isSleeping: true, error: 'Probe timed out (server may be waking up from sleep)' };
      }
      return { reachable: false, error: err.message || String(err) };
    }
  }

  async connect(options: TransportConnectOptions): Promise<void> {
    if (this.socket && this.connected) {
      return;
    }

    let ioClient: any;
    try {
      // Load socket.io-client dynamically (supports monorepo / bundled resolution)
      const mod: any = await import('socket.io-client');
      ioClient = mod.io || mod.default?.io || mod.default;
    } catch {
      throw new Error(
        'socket.io-client module is not available in the current environment. Please run "npm install socket.io-client" or use MockAgentTransport for testing.'
      );
    }

    return new Promise((resolve, reject) => {
      const targetUrl = `${options.url.replace(/\/+$/, '')}${options.namespace}`;

      console.log(
        `[SocketIoTransport] Attempting connection to ${targetUrl} (transports: polling -> websocket, timeout: ${options.timeoutMs}ms)`
      );

      const connectionTimeout = setTimeout(() => {
        if (this.socket) {
          try { this.socket.disconnect(); } catch {}
          this.socket = null;
        }
        const timeoutError = new Error(
          `Socket.IO connection timed out after ${options.timeoutMs}ms. If using free-tier cloud hosting (Render), the server may be waking up from sleep. Please wait a moment and try again.`
        );
        console.error(`[SocketIoTransport] Timeout on ${targetUrl}`);
        this.triggerHandlers('error', timeoutError);
        reject(timeoutError);
      }, options.timeoutMs);

      try {
        this.socket = ioClient(targetUrl, {
          auth: {
            token: options.deviceToken || ''
          },
          transports: ['polling', 'websocket'], // Start with HTTP polling to establish session and upgrade smoothly to WebSocket
          timeout: options.timeoutMs,
          autoConnect: true,
          reconnection: false, // Reconnection is controlled by AgentConnectionService state machine
          rejectUnauthorized: true // STRICT: Enforce valid TLS certificates in all environments
        });

        this.socket.on('connect', () => {
          clearTimeout(connectionTimeout);
          this.connected = true;
          const engineTransport = this.socket.io?.engine?.transport?.name || 'polling';
          console.log(
            `[SocketIoTransport] Connected to ${targetUrl} via ${engineTransport} (socketId: ${this.socket.id})`
          );
          this.triggerHandlers('connect', { socketId: this.socket.id, transport: engineTransport });
          resolve();
        });

        // Listen for transport upgrade (polling -> websocket)
        this.socket.io?.engine?.on('upgrade', (newTransport: any) => {
          console.log(`[SocketIoTransport] Transport upgraded to: ${newTransport?.name || 'websocket'}`);
          this.triggerHandlers('transport:upgrade', newTransport?.name);
        });

        this.socket.on('disconnect', (reason: string) => {
          this.connected = false;
          console.log(`[SocketIoTransport] Disconnected from ${targetUrl} (reason: ${reason})`);
          this.triggerHandlers('disconnect', reason);
        });

        this.socket.on('connect_error', (err: any) => {
          clearTimeout(connectionTimeout);
          this.connected = false;

          let friendlyError = err;
          const rawMsg = err?.message || String(err);
          console.error(`[SocketIoTransport] Connection error on ${targetUrl}: ${rawMsg}`);

          if (rawMsg === 'Invalid namespace') {
            friendlyError = new Error(
              `The remote backend at ${targetUrl} is online, but the /agent gateway namespace is not deployed on this server. The backend deployment needs to be updated with Local Compiler gateway support.`
            );
          } else if (rawMsg.includes('DEVICE_AUTHENTICATION_FAILED')) {
            friendlyError = new Error(
              `Device authentication failed: Invalid or revoked device token. Please unpair and re-pair this device.`
            );
          } else if (rawMsg.includes('xhr poll error') || rawMsg.includes('websocket error')) {
            friendlyError = new Error(
              `Network transport error connecting to ${targetUrl}: ${err.description?.message || rawMsg}`
            );
          }

          this.triggerHandlers('error', friendlyError);
          reject(friendlyError);
        });

        // Forward arbitrary inbound events
        this.socket.onAny((event: string, ...args: any[]) => {
          this.triggerHandlers(event, ...args);
        });
      } catch (err: any) {
        clearTimeout(connectionTimeout);
        console.error(`[SocketIoTransport] Socket initialization exception: ${err.message}`);
        reject(err);
      }
    });
  }

  async disconnect(reason: string = 'client_manual_disconnect'): Promise<void> {
    if (this.socket) {
      try {
        this.socket.disconnect();
      } catch {}
      this.socket = null;
    }
    this.connected = false;
    this.triggerHandlers('disconnect', reason);
  }

  emit(event: string, data: any): void {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    }
  }

  on(event: string, handler: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off(event: string, handler: (...args: any[]) => void): void {
    this.listeners.get(event)?.delete(handler);
  }

  isConnected(): boolean {
    return this.connected;
  }

  private triggerHandlers(event: string, ...args: any[]): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const h of handlers) {
        try {
          h(...args);
        } catch (err) {
          console.error(`[SocketIoAgentTransport] Error in handler for event "${event}":`, err);
        }
      }
    }
  }
}
