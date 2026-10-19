/**
 * MUJCODE Local Compiler — Electron IPC Handlers
 * 
 * Strict boundary ensuring that only validated, non-destructive compiler and
 * networking operations can be invoked by the renderer process.
 */

import path from 'node:path';
import { ipcMain, shell, BrowserWindow, app, safeStorage } from 'electron';
import { IPC_CHANNELS } from '../shared/ipcChannels.js';
import { adapterBridge } from '../compiler/adapterBridge.js';
import { runtimeDoctor } from '../services/runtimeDoctor.js';
import { SUPPORTED_LANGUAGES } from '../compiler/registry.js';
import { ExecutionRequest } from '../shared/executionTypes.js';
import { AgentConnectionService } from '../networking/agentConnectionService.js';
import { SocketIoAgentTransport } from '../networking/transport/socketIoTransport.js';
import { CredentialStorage } from '../networking/credentialStorage.js';
import { DEFAULT_DEV_CONFIG, DEFAULT_PROD_CONFIG, AgentConfig, validateAgentConfig } from '../networking/agentConfig.js';

let agentConnectionService: AgentConnectionService | null = null;

export function getAgentConnectionService(): AgentConnectionService {
  if (!agentConnectionService) {
    const isProd = app ? (app.isPackaged || process.env.NODE_ENV === 'production') : false;
    const customUrl = process.env.MUJCODE_BACKEND_URL;
    const config: AgentConfig = isProd ? { ...DEFAULT_PROD_CONFIG } : { ...DEFAULT_DEV_CONFIG };
    if (customUrl) {
      config.backendBaseUrl = customUrl;
    }
    validateAgentConfig(config);

    let storagePath: string | null = null;
    try {
      if (app && typeof app.getPath === 'function') {
        storagePath = path.join(app.getPath('userData'), 'device_credential.enc');
      }
    } catch {}

    const transport = new SocketIoAgentTransport();
    const credentialStorage = new CredentialStorage(config.isProduction, storagePath, safeStorage);
    agentConnectionService = new AgentConnectionService(transport, config, credentialStorage);
    console.log(`[Main IPC] AgentConnectionService initialized. Backend: ${config.backendBaseUrl}, Production: ${config.isProduction}`);
  }
  return agentConnectionService;
}

export function registerIpcHandlers(mainWindow?: BrowserWindow | null): void {
  const connService = getAgentConnectionService();

  // Clean existing handlers before registering to prevent duplicate handler collisions
  for (const channel of Object.values(IPC_CHANNELS)) {
    try {
      ipcMain.removeHandler(channel);
    } catch {}
  }

  // Subscribe state machine to notify renderer UI of connection updates
  connService.getStateMachine().subscribe((newState, oldState, reason) => {
    console.log(`[Main State] Connection state transition: ${oldState} -> ${newState}${reason ? ` (${reason})` : ''}`);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC_CHANNELS.ON_CONNECTION_STATE_CHANGED, {
        status: newState,
        previousStatus: oldState,
        reason: reason || null
      });
    }
  });

  // Execute code request from UI
  ipcMain.handle(IPC_CHANNELS.EXECUTE_CODE, async (_event: any, request: ExecutionRequest) => {
    console.log(`[Main IPC] Executing code: ${request.language} (${request.requestId})`);
    return adapterBridge.executeCode(request);
  });

  // Get toolchain diagnostics
  ipcMain.handle(IPC_CHANNELS.GET_DIAGNOSTICS, async () => {
    console.log('[Main IPC] Running toolchain diagnostics...');
    try {
      const results = await runtimeDoctor.diagnoseAll();
      console.log(`[Main IPC] Toolchain diagnostics complete: ${results.filter(r => r.available).length}/${results.length} available.`);
      return results;
    } catch (err: any) {
      console.error('[Main IPC] Toolchain diagnostics error:', err.message);
      throw err;
    }
  });

  // Get supported languages list
  ipcMain.handle(IPC_CHANNELS.GET_SUPPORTED_LANGUAGES, async () => {
    return SUPPORTED_LANGUAGES;
  });

  // Safe external URL opener (for Winget / toolchain downloads)
  ipcMain.handle(IPC_CHANNELS.OPEN_EXTERNAL_URL, async (_event: any, rawUrl: string) => {
    if (typeof rawUrl === 'string' && (rawUrl.startsWith('https://') || rawUrl.startsWith('http://'))) {
      await shell.openExternal(rawUrl);
      return { success: true };
    }
    return { success: false, error: 'Invalid URL protocol' };
  });

  // --- Networking & Pairing Endpoints ---

  ipcMain.handle(IPC_CHANNELS.GET_CONNECTION_STATE, async () => {
    return {
      status: connService.getState(),
      lastError: connService.getStateMachine().getLastError(),
      backendUrl: connService.getConfig().backendBaseUrl
    };
  });

  ipcMain.handle(IPC_CHANNELS.GET_PAIRING_STATUS, async () => {
    return connService.getPairingService().getSafeStatus();
  });

  ipcMain.handle(IPC_CHANNELS.CONNECT, async () => {
    console.log(`[Main IPC] Connect requested. Current state: ${connService.getState()}`);
    try {
      const isPaired = await connService.getPairingService().isPaired();
      if (!isPaired) {
        return { success: false, error: 'Device is not paired yet. Please enter a pairing challenge code and click Pair Device.' };
      }
      await connService.connect();
      return { success: true };
    } catch (err: any) {
      console.error('[Main IPC] Connect failure:', err.message);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.DISCONNECT, async () => {
    console.log('[Main IPC] Disconnect requested.');
    try {
      await connService.disconnect();
      return { success: true };
    } catch (err: any) {
      console.error('[Main IPC] Disconnect error:', err.message);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.SUBMIT_PAIRING_CODE, async (_event: any, code: string, customBackendUrl?: string) => {
    const targetUrl = customBackendUrl?.trim() || connService.getConfig().backendBaseUrl;
    console.log(`[Main IPC] Submitting pairing challenge code (length: ${code ? code.length : 0}) to ${targetUrl}`);
    try {
      const res = await connService.pairAndConnect(code, targetUrl);
      console.log('[Main IPC] Pairing result:', res.success ? `Success (${res.userDisplayName})` : `Failed (${res.error})`);
      return res;
    } catch (err: any) {
      console.error('[Main IPC] Pairing exception:', err.message);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.UNPAIR, async () => {
    console.log('[Main IPC] Unpair requested.');
    try {
      await connService.unpair();
      console.log('[Main IPC] Unpair completed.');
      return { success: true };
    } catch (err: any) {
      console.error('[Main IPC] Unpair error:', err.message);
      return { success: false, error: err.message };
    }
  });
}
