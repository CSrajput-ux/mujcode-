/**
 * MUJCODE Local Compiler — Deterministic Mock Transport
 * 
 * Provides an in-memory transport harness for comprehensive unit and integration testing
 * without requiring a live cloud backend or network sockets.
 */

import { IAgentTransport, TransportConnectOptions } from './transportInterface.js';

export class MockAgentTransport implements IAgentTransport {
  private connected: boolean = false;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private sentMessages: Array<{ event: string; data: any; timestamp: number }> = [];
  public connectShouldFail: boolean = false;
  public failReason: string = 'Simulated connection failure';
  public pairingResponder: ((data: any) => any) | null = null;

  getTransportType(): 'mock' {
    return 'mock';
  }

  async connect(options: TransportConnectOptions): Promise<void> {
    if (this.connectShouldFail) {
      this.connected = false;
      this.emitEvent('error', new Error(this.failReason));
      throw new Error(this.failReason);
    }

    this.connected = true;
    this.emitEvent('connect', { socketId: 'mock_socket_123', url: options.url });
  }

  async disconnect(reason: string = 'client_disconnect'): Promise<void> {
    if (!this.connected) return;
    this.connected = false;
    this.emitEvent('disconnect', reason);
  }

  emit(event: string, data: any): void {
    this.sentMessages.push({ event, data, timestamp: Date.now() });

    // Automatic mock server behavior for heartbeats
    if (event === 'heartbeat') {
      setTimeout(() => {
        this.emitEvent('heartbeat:ack', {
          protocolVersion: '1.0.0',
          timestamp: data?.timestamp || Date.now(),
          serverTime: Date.now()
        });
      }, 5);
    }

    // Automatic mock server behavior for pairing challenge redemption
    if (event === 'pairing:request' && this.pairingResponder) {
      setTimeout(() => {
        try {
          const resp = this.pairingResponder!(data);
          this.emitEvent('pairing:response', resp);
        } catch (err: any) {
          this.emitEvent('pairing:response', { success: false, error: err.message });
        }
      }, 5);
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

  // --- Mock Harness Helpers ---

  /**
   * Simulate an incoming event from the server to the client.
   */
  emitEvent(event: string, ...args: any[]): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(...args);
        } catch (err) {
          console.error(`[MockAgentTransport] Error in handler for event "${event}":`, err);
        }
      }
    }
  }

  /**
   * Get all messages emitted by the client.
   */
  getSentMessages(): Array<{ event: string; data: any; timestamp: number }> {
    return [...this.sentMessages];
  }

  /**
   * Find last emitted message by event name.
   */
  getLastSentMessage(eventName: string): any | null {
    for (let i = this.sentMessages.length - 1; i >= 0; i--) {
      if (this.sentMessages[i].event === eventName) {
        return this.sentMessages[i].data;
      }
    }
    return null;
  }

  clearSentMessages(): void {
    this.sentMessages = [];
  }
}
