/**
 * MUJCODE Local Compiler — Preload Script
 * 
 * Secure, context-isolated bridge between Renderer and Main Process.
 * Does not leak Node.js internals or arbitrary execution primitives.
 */

import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/ipcChannels.js';
import { ExecutionRequest, ExecutionResult, ToolchainDiagnostic, LanguageDefinition } from '../shared/executionTypes.js';
import { SafePairingStatus, AgentConnectionStatus } from '../shared/agentProtocol.js';

export interface MujCodeBridgeApi {
  // Compiler Execution & Health
  executeCode: (request: ExecutionRequest) => Promise<ExecutionResult>;
  getDiagnostics: () => Promise<ToolchainDiagnostic[]>;
  getSupportedLanguages: () => Promise<LanguageDefinition[]>;
  openExternalUrl: (url: string) => Promise<{ success: boolean; error?: string }>;
  installToolchain: (wingetId: string) => Promise<{ success: boolean; output: string }>;
  rescanLanguage: (languageKey: string) => Promise<ToolchainDiagnostic>;


  // Secure Networking & Pairing
  getConnectionState: () => Promise<{ status: AgentConnectionStatus; lastError: string | null }>;
  getPairingStatus: () => Promise<SafePairingStatus>;
  connect: () => Promise<{ success: boolean; error?: string }>;
  disconnect: () => Promise<{ success: boolean; error?: string }>;
  submitPairingCode: (code: string, backendUrl?: string) => Promise<{ success: boolean; userDisplayName?: string; error?: string }>;
  unpair: () => Promise<{ success: boolean; error?: string }>;
  onConnectionStateChanged: (listener: (event: { status: AgentConnectionStatus; previousStatus: AgentConnectionStatus; reason: string | null }) => void) => () => void;
}

const api: MujCodeBridgeApi = {
  executeCode: (request: ExecutionRequest): Promise<ExecutionResult> => {
    return ipcRenderer.invoke(IPC_CHANNELS.EXECUTE_CODE, request);
  },
  getDiagnostics: (): Promise<ToolchainDiagnostic[]> => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_DIAGNOSTICS);
  },
  getSupportedLanguages: (): Promise<LanguageDefinition[]> => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_SUPPORTED_LANGUAGES);
  },
  openExternalUrl: (url: string): Promise<{ success: boolean; error?: string }> => {
    return ipcRenderer.invoke(IPC_CHANNELS.OPEN_EXTERNAL_URL, url);
  },
  installToolchain: (wingetId: string): Promise<{ success: boolean; output: string }> => {
    return ipcRenderer.invoke(IPC_CHANNELS.INSTALL_TOOLCHAIN, wingetId);
  },
  rescanLanguage: (languageKey: string): Promise<ToolchainDiagnostic> => {
    return ipcRenderer.invoke(IPC_CHANNELS.RESCAN_LANGUAGE, languageKey);
  },


  // Networking
  getConnectionState: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_CONNECTION_STATE);
  },
  getPairingStatus: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_PAIRING_STATUS);
  },
  connect: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.CONNECT);
  },
  disconnect: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.DISCONNECT);
  },
  submitPairingCode: (code: string, backendUrl?: string) => {
    return ipcRenderer.invoke(IPC_CHANNELS.SUBMIT_PAIRING_CODE, code, backendUrl);
  },
  unpair: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.UNPAIR);
  },
  onConnectionStateChanged: (listener) => {
    const handler = (_event: any, data: any) => listener(data);
    ipcRenderer.on(IPC_CHANNELS.ON_CONNECTION_STATE_CHANGED, handler);
    return () => ipcRenderer.off(IPC_CHANNELS.ON_CONNECTION_STATE_CHANGED, handler);
  }
};

contextBridge.exposeInMainWorld('mujcode', api);
