/**
 * MUJCODE Local Compiler — Transport Interface
 * 
 * Abstraction layer for outbound network communication.
 * Allows seamless switching between real Socket.IO Client and deterministic Mock Transport.
 */

export interface TransportConnectOptions {
  url: string;
  namespace: string;
  deviceToken?: string;
  timeoutMs: number;
}

export interface IAgentTransport {
  connect(options: TransportConnectOptions): Promise<void>;
  disconnect(reason?: string): Promise<void>;
  emit(event: string, data: any): void;
  on(event: string, handler: (...args: any[]) => void): void;
  off(event: string, handler: (...args: any[]) => void): void;
  isConnected(): boolean;
  getTransportType(): 'socket.io' | 'mock';
}
