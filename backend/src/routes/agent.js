import { sendJson } from '../lib/http.js';
import { requireAuth } from '../lib/requireAuth.js';
import { AgentDeviceService } from '../services/AgentDeviceService.js';
import { AgentJobRouter } from '../services/AgentJobRouter.js';
import { logger } from '../lib/logger.js';

export function registerAgentRoutes(router) {
  /**
   * POST /api/agent/challenge
   * ─────────────────────────
   * Request a cryptographically secure, 5-minute single-use pairing challenge.
   * Requires an authenticated student/user session.
   */
  router.post('/api/agent/challenge', async (req, res) => {
    if (!requireAuth(req, res)) return;

    try {
      const challenge = await AgentDeviceService.generateChallenge(req.user);
      return sendJson(res, 200, {
        success: true,
        ...challenge
      });
    } catch (err) {
      logger.error('[api/agent/challenge] Error generating challenge:', err.message);
      const status = err.message.includes('Rate limit') ? 429 : 500;
      return sendJson(res, status, {
        success: false,
        error: err.message || 'Failed to generate pairing challenge'
      });
    }
  });

  /**
   * GET /api/agent/devices
   * ──────────────────────
   * List all paired devices belonging to the authenticated student,
   * along with live online/offline connection state.
   */
  router.get('/api/agent/devices', async (req, res) => {
    if (!requireAuth(req, res)) return;

    try {
      const userId = req.user.id || req.user.college_id;
      const devices = await AgentDeviceService.getUserDevices(userId);

      const enrichedDevices = devices.map(d => ({
        ...d,
        isOnline: AgentJobRouter.isDeviceConnected(d.deviceId)
      }));

      return sendJson(res, 200, {
        success: true,
        devices: enrichedDevices
      });
    } catch (err) {
      logger.error('[api/agent/devices] Error fetching devices:', err.message);
      return sendJson(res, 500, {
        success: false,
        error: 'Failed to retrieve paired devices'
      });
    }
  });

  /**
   * DELETE /api/agent/devices/:deviceId
   * ───────────────────────────────────
   * Revoke and unpair a device owned by the authenticated student.
   * Immediately disconnects the active agent socket.
   */
  router.delete('/api/agent/devices/:deviceId', async (req, res) => {
    if (!requireAuth(req, res)) return;

    try {
      const userId = req.user.id || req.user.college_id;
      const deviceId = req.params.deviceId;

      const result = await AgentDeviceService.revokeDevice(userId, deviceId);
      if (!result.success) {
        return sendJson(res, 404, {
          success: false,
          error: result.error || 'Device not found or not owned by user'
        });
      }

      // If active socket exists, disconnect it
      const activeSocket = AgentJobRouter.activeSockets.get(deviceId);
      if (activeSocket) {
        AgentJobRouter.unregisterAgentSocket(deviceId, activeSocket);
        activeSocket.disconnect(true);
      }

      return sendJson(res, 200, {
        success: true,
        message: 'Device revoked and unpaired successfully'
      });
    } catch (err) {
      logger.error('[api/agent/devices/:deviceId] Revocation error:', err.message);
      return sendJson(res, 500, {
        success: false,
        error: 'Failed to revoke device'
      });
    }
  });

  /**
   * GET /api/agent/status
   * ─────────────────────
   * Quick connection status for ProblemSolver and student dashboard.
   */
  router.get('/api/agent/status', async (req, res) => {
    if (!requireAuth(req, res)) return;

    try {
      const userId = req.user.id || req.user.college_id;
      const devices = await AgentDeviceService.getUserDevices(userId);
      const activeDevices = devices.filter(d => !d.revoked);

      const connected = AgentJobRouter.getConnectedDeviceForUser(userId);

      return sendJson(res, 200, {
        success: true,
        hasPairedDevice: activeDevices.length > 0,
        isOnline: Boolean(connected),
        activeDevice: connected ? {
          deviceId: connected.deviceId,
          deviceName: connected.device?.deviceName || 'Local Computer',
          agentVersion: connected.device?.agentVersion || '1.0.0',
          compilers: connected.device?.compilers || {}
        } : (activeDevices[0] || null)
      });
    } catch (err) {
      logger.error('[api/agent/status] Status error:', err.message);
      return sendJson(res, 500, {
        success: false,
        error: 'Failed to check agent status'
      });
    }
  });
}
