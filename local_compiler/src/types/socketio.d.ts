/**
 * Ambient type declarations for socket.io-client
 */

declare module 'socket.io-client' {
  export interface Socket {
    id?: string;
    connected: boolean;
    emit(event: string, ...args: any[]): this;
    on(event: string, listener: (...args: any[]) => void): this;
    off(event: string, listener: (...args: any[]) => void): this;
    onAny(listener: (event: string, ...args: any[]) => void): this;
    disconnect(): this;
  }

  export function io(uri?: string, opts?: any): Socket;
  export default io;
}
