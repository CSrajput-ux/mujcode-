import { AgentDeviceService } from '../services/AgentDeviceService.js';
import { AgentJobRouter } from '../services/AgentJobRouter.js';
import { logger } from '../lib/logger.js';

/**
 * Configure the /agent Socket.IO namespace for MUJCODE Local Compiler desktop agents
 */
export function setupAgentGateway(io) {
  const agentNs = io.of('/agent');

  // ─── Namespace Authentication Guard ─────────────────────────────────────────
  agentNs.use(async (socket, next) => {
    try {
      const rawToken = socket.handshake.auth?.token;

      if (rawToken && typeof rawToken === 'string' && rawToken.trim()) {
        // Authenticated device connection
        const device = await AgentDeviceService.authenticateDevice(rawToken.trim());
        if (!device) {
          logger.warn(`[AgentGateway] Connection rejected: invalid or revoked device token (${socket.id})`);
          return next(new Error('DEVICE_AUTHENTICATION_FAILED: Invalid or revoked device credential.'));
        }

        socket.device = device;
        socket.deviceId = device.deviceId;
        socket.userId = device.userId;
        socket.isAuthenticatedDevice = true;
        socket.isPairingSocket = false;
        return next();
      }

      // No token provided: allow connection strictly for pairing challenge redemption
      socket.isAuthenticatedDevice = false;
      socket.isPairingSocket = true;
      return next();
    } catch (err) {
      logger.error('[AgentGateway] Socket middleware authentication error:', err);
      return next(new Error('INTERNAL_AUTHENTICATION_ERROR'));
    }
  });

  // ─── Connection Lifecycle ───────────────────────────────────────────────────
  agentNs.on('connection', (socket) => {
    // Case 1: Temporary unauthenticated pairing socket
    if (socket.isPairingSocket) {
      logger.info(`[AgentGateway] Unauthenticated agent connected for pairing: ${socket.id}`);

      // Handle pairing challenge redemption
      socket.on('pairing:request', async (payload) => {
        try {
          if (!payload || !payload.challengeCode) {
            return socket.emit('pairing:response', {
              success: false,
              error: 'Invalid pairing request: challenge code is required'
            });
          }

          const res = await AgentDeviceService.redeemChallenge(payload.challengeCode, payload);
          socket.emit('pairing:response', res);
        } catch (err) {
          logger.error('[AgentGateway] Error handling pairing:request:', err);
          socket.emit('pairing:response', {
            success: false,
            error: 'Server error processing pairing challenge'
          });
        }
      });

      socket.on('disconnect', () => {
        logger.debug(`[AgentGateway] Pairing socket disconnected: ${socket.id}`);
      });
      return;
    }

    // Case 2: Fully authenticated persistent desktop agent
    const { deviceId, userId } = socket;
    logger.info(`[AgentGateway] Desktop agent connected: ${deviceId} (User: ${userId}, Socket: ${socket.id})`);

    // Register active agent in job router
    AgentJobRouter.registerAgentSocket(deviceId, socket, userId);

    // Heartbeat monitoring
    socket.on('heartbeat', (payload) => {
      try {
        AgentDeviceService.updateHeartbeat(deviceId, payload?.compilers, payload?.agentVersion);
        socket.emit('heartbeat:ack', {
          protocolVersion: '1.0.0',
          timestamp: payload?.timestamp || Date.now(),
          serverTime: Date.now()
        });
      } catch (err) {
        logger.warn(`[AgentGateway] Error handling heartbeat from ${deviceId}: ${err.message}`);
      }
    });

    // Inbound job result from agent
    socket.on('job:result', (result) => {
      try {
        AgentJobRouter.handleJobResult(deviceId, result);
      } catch (err) {
        logger.error(`[AgentGateway] Error handling job:result from ${deviceId}:`, err);
      }
    });

    // Device unpairing revocation from desktop
    socket.on('pairing:revoke', async () => {
      try {
        logger.info(`[AgentGateway] Agent ${deviceId} requested unpairing revocation`);
        await AgentDeviceService.revokeDevice(userId, deviceId);
        AgentJobRouter.unregisterAgentSocket(deviceId, socket);
        socket.disconnect(true);
      } catch (err) {
        logger.warn(`[AgentGateway] Error revoking device ${deviceId}: ${err.message}`);
      }
    });

    // Disconnect cleanup
    socket.on('disconnect', (reason) => {
      logger.info(`[AgentGateway] Agent ${deviceId} disconnected: ${reason}`);
      AgentJobRouter.unregisterAgentSocket(deviceId, socket);
    });
  });

  logger.info('[AgentGateway] Attached /agent Socket.IO namespace for Local Compiler integration.');
  return agentNs;
}
