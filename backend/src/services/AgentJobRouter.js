import { CodeExecutionService } from './CodeExecutionService.js';
import { logger } from '../lib/logger.js';

export class AgentJobRouter {
  // deviceId -> Socket instance
  static activeSockets = new Map();

  // userId -> Set<deviceId>
  static userDevices = new Map();

  // jobId -> { resolve, reject, timeoutTimer, deviceId, userId, startedAt }
  static pendingJobs = new Map();

  /**
   * Register an authenticated agent socket upon connection
   */
  static registerAgentSocket(deviceId, socket, userId) {
    this.activeSockets.set(deviceId, socket);

    if (userId) {
      const userStr = String(userId);
      if (!this.userDevices.has(userStr)) {
        this.userDevices.set(userStr, new Set());
      }
      this.userDevices.get(userStr).add(deviceId);
    }

    logger.info(`[AgentJobRouter] Agent socket registered for device ${deviceId} (User: ${userId})`);
  }

  /**
   * Deregister an agent socket upon disconnection
   */
  static unregisterAgentSocket(deviceId, socket) {
    const existing = this.activeSockets.get(deviceId);
    if (existing && existing.id === socket.id) {
      this.activeSockets.delete(deviceId);

      // Clean up user device mapping
      if (socket.userId) {
        const userSet = this.userDevices.get(String(socket.userId));
        if (userSet) {
          userSet.delete(deviceId);
          if (userSet.size === 0) {
            this.userDevices.delete(String(socket.userId));
          }
        }
      }

      // Reject any pending jobs assigned to this device
      for (const [jobId, job] of this.pendingJobs.entries()) {
        if (job.deviceId === deviceId) {
          clearTimeout(job.timeoutTimer);
          job.reject(new Error('Agent disconnected during execution'));
          this.pendingJobs.delete(jobId);
        }
      }

      logger.info(`[AgentJobRouter] Agent socket unregistered for device ${deviceId}`);
    }
  }

  /**
   * Check if a specific device is currently online and connected
   */
  static isDeviceConnected(deviceId) {
    if (!deviceId) return false;
    const socket = this.activeSockets.get(deviceId);
    return Boolean(socket && socket.connected);
  }

  /**
   * Find a connected device for a specific user
   */
  static getConnectedDeviceForUser(userId) {
    if (!userId) return null;
    const userStr = String(userId);
    const devices = this.userDevices.get(userStr);
    if (!devices || devices.size === 0) return null;

    for (const devId of devices) {
      const socket = this.activeSockets.get(devId);
      if (socket && socket.connected) {
        return {
          deviceId: devId,
          socket,
          device: socket.device || {}
        };
      }
    }
    return null;
  }

  /**
   * Dispatch a Run job to a student's connected desktop agent
   */
  static async dispatchRunJob({
    userId,
    deviceId,
    jobId,
    language,
    sourceCode,
    stdin = '',
    timeLimitMs = 5000
  }) {
    let targetSocket = null;
    let targetDeviceId = deviceId;

    if (targetDeviceId) {
      targetSocket = this.activeSockets.get(targetDeviceId);
    } else {
      const connected = this.getConnectedDeviceForUser(userId);
      if (connected) {
        targetSocket = connected.socket;
        targetDeviceId = connected.deviceId;
      }
    }

    if (!targetSocket || !targetSocket.connected) {
      throw new Error('Local Compiler is not connected. Please ensure the desktop app is running and connected.');
    }

    const languageId = CodeExecutionService.resolveLanguageId(language);
    const clampedTimeLimit = Math.min(15000, Math.max(1000, Number(timeLimitMs) || 5000));

    const dispatchPayload = {
      protocolVersion: '1.0.0',
      jobId,
      languageId,
      sourceCode,
      stdin: stdin || '',
      timeLimitMs: clampedTimeLimit,
      timestamp: Date.now(),
      expiresAt: Date.now() + 30000
    };

    return new Promise((resolve, reject) => {
      // 25-second server-side deadline
      const timeoutTimer = setTimeout(() => {
        this.pendingJobs.delete(jobId);
        reject(new Error('Local compiler execution timed out after 25s'));
      }, 25000);

      this.pendingJobs.set(jobId, {
        resolve,
        reject,
        timeoutTimer,
        deviceId: targetDeviceId,
        userId: String(userId),
        startedAt: Date.now()
      });

      targetSocket.emit('job:dispatch', dispatchPayload);
      logger.info(`[AgentJobRouter] Dispatched job ${jobId} (lang: ${languageId}) to device ${targetDeviceId}`);
    });
  }

  /**
   * Handle an inbound job:result emitted by the desktop agent
   */
  static handleJobResult(deviceId, result) {
    if (!result || !result.jobId) {
      logger.warn(`[AgentJobRouter] Received malformed job:result from device ${deviceId}`);
      return;
    }

    const pending = this.pendingJobs.get(result.jobId);
    if (!pending) {
      logger.warn(`[AgentJobRouter] Received result for unknown or already completed job: ${result.jobId}`);
      return;
    }

    // Verify device ownership
    if (pending.deviceId !== deviceId) {
      logger.error(`[AgentJobRouter] Security Alert: Device ${deviceId} attempted to submit result for job ${result.jobId} assigned to device ${pending.deviceId}`);
      return;
    }

    clearTimeout(pending.timeoutTimer);
    this.pendingJobs.delete(result.jobId);

    // Normalize output
    const rawOutput = (result.stdout || result.stderr || result.compileError || '').trim();
    let verdict = result.verdict || 'Successful';
    if (result.status === 'COMPILATION_ERROR') {
      verdict = 'Compilation Error';
    } else if (result.status === 'TIME_LIMIT_EXCEEDED') {
      verdict = 'Time Limit Exceeded';
    } else if (result.status === 'RUNTIME_ERROR') {
      verdict = 'Runtime Error';
    } else if (result.status === 'DEPENDENCY_MISSING') {
      verdict = 'Dependency Missing';
    }

    const normalizedResult = {
      verdict,
      status: result.status,
      output: rawOutput || (result.status === 'SUCCESS' ? 'Program executed successfully with no output.' : 'Execution failed.'),
      compileOutput: result.compileError || '',
      executionTime: `${result.executionTimeMs || 0}ms`,
      isLocalExecution: true,
      agentVersion: result.agentVersion || '1.0.0',
      exitCode: result.exitCode
    };

    logger.info(`[AgentJobRouter] Job ${result.jobId} completed on local agent: ${verdict} (${result.executionTimeMs}ms)`);
    pending.resolve(normalizedResult);
  }
}
