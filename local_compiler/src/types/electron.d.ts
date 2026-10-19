/**
 * Ambient type definitions for Electron module
 */

declare module 'electron' {
  export interface WebContents {
    send(channel: string, ...args: any[]): void;
  }

  export interface App {
    requestSingleInstanceLock(): boolean;
    quit(): void;
    on(event: string, listener: (...args: any[]) => void): this;
    whenReady(): Promise<void>;
  }

  export interface WebPreferences {
    preload?: string;
    contextIsolation?: boolean;
    nodeIntegration?: boolean;
    sandbox?: boolean;
    webSecurity?: boolean;
    allowRunningInsecureContent?: boolean;
  }

  export interface BrowserWindowOptions {
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
    title?: string;
    backgroundColor?: string;
    show?: boolean;
    webPreferences?: WebPreferences;
  }

  export class BrowserWindow {
    constructor(options?: BrowserWindowOptions);
    webContents: WebContents;
    loadFile(filePath: string): Promise<void>;
    show(): void;
    focus(): void;
    isMinimized(): boolean;
    restore(): void;
    isDestroyed(): boolean;
    on(event: string, listener: (...args: any[]) => void): this;
    once(event: string, listener: (...args: any[]) => void): this;
    static getAllWindows(): BrowserWindow[];
  }

  export const app: App;

  export const ipcMain: {
    handle(channel: string, listener: (event: any, ...args: any[]) => any): void;
    on(channel: string, listener: (event: any, ...args: any[]) => void): void;
  };

  export const ipcRenderer: {
    invoke(channel: string, ...args: any[]): Promise<any>;
    send(channel: string, ...args: any[]): void;
    on(channel: string, listener: (event: any, ...args: any[]) => void): void;
    off(channel: string, listener: (event: any, ...args: any[]) => void): void;
  };

  export const contextBridge: {
    exposeInMainWorld(apiKey: string, api: Record<string, any>): void;
  };

  export const shell: {
    openExternal(url: string): Promise<void>;
  };
}
