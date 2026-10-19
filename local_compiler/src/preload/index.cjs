/**
 * MUJCODE Local Compiler — Preload Script
 * 
 * CommonJS context-isolated bridge for Electron sandbox.
 * Exposes window.mujcode securely to renderer.
 */

const { contextBridge, ipcRenderer } = require('electron');

const IPC_CHANNELS = {
  EXECUTE_CODE: 'compiler:execute-code',
  GET_DIAGNOSTICS: 'doctor:get-diagnostics',
  GET_SUPPORTED_LANGUAGES: 'compiler:get-languages',
  OPEN_EXTERNAL_URL: 'system:open-external',
  GET_CONNECTION_STATE: 'agent:get-connection-state',
  GET_PAIRING_STATUS: 'agent:get-pairing-status',
  CONNECT: 'agent:connect',
  DISCONNECT: 'agent:disconnect',
  SUBMIT_PAIRING_CODE: 'agent:submit-pairing-code',
  UNPAIR: 'agent:unpair',
  ON_CONNECTION_STATE_CHANGED: 'agent:on-connection-state-changed'
};

const api = {
  // Compiler Execution & Health
  executeCode: (request) => {
    return ipcRenderer.invoke(IPC_CHANNELS.EXECUTE_CODE, request);
  },
  getDiagnostics: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_DIAGNOSTICS);
  },
  getSupportedLanguages: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_SUPPORTED_LANGUAGES);
  },
  openExternalUrl: (url) => {
    return ipcRenderer.invoke(IPC_CHANNELS.OPEN_EXTERNAL_URL, url);
  },

  // Secure Networking & Pairing
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
  submitPairingCode: (code, backendUrl) => {
    return ipcRenderer.invoke(IPC_CHANNELS.SUBMIT_PAIRING_CODE, code, backendUrl);
  },
  unpair: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.UNPAIR);
  },
  onConnectionStateChanged: (listener) => {
    const handler = (_event, data) => listener(data);
    ipcRenderer.on(IPC_CHANNELS.ON_CONNECTION_STATE_CHANGED, handler);
    return () => ipcRenderer.off(IPC_CHANNELS.ON_CONNECTION_STATE_CHANGED, handler);
  }
};

contextBridge.exposeInMainWorld('mujcode', api);
