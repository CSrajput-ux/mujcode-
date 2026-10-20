import crypto from 'node:crypto';
import { loadDb, saveDb } from '../lib/storage.js';
import { getPostgresPool, isPostgresConnected } from '../lib/postgres.js';
import { logger } from '../lib/logger.js';

const CHALLENGE_LIFETIME_MS = 5 * 60 * 1000; // 5 minutes

// In-memory atomic rate limit for challenge generation (per user: max 5 requests per 5 minutes)
const userChallengeRateLimits = new Map();

export class AgentDeviceService {
  /**
   * Reset rate limits (used in test setups)
   */
  static clearRateLimits() {
    userChallengeRateLimits.clear();
  }

  /**
   * Compute a secure SHA-256 hash of a bearer token
   */
  static hashToken(token) {
    if (!token || typeof token !== 'string') return '';
    return crypto.createHash('sha256').update(token.trim()).digest('hex');
  }

  /**
   * Generate an unpredictable, single-use pairing challenge for an authenticated student
   */
  static async generateChallenge(user) {
    if (!user || !user.id) {
      throw new Error('Authentication required: user ID missing');
    }

    const userId = String(user.id || user.college_id);
    const now = Date.now();

    // Check rate limit: 15 challenges per 5 minutes
    const rl = userChallengeRateLimits.get(userId) || [];
    const validRl = rl.filter(t => now - t < CHALLENGE_LIFETIME_MS);
    if (validRl.length >= 15) {
      throw new Error('Rate limit exceeded: too many pairing attempts. Please wait 5 minutes.');
    }
    validRl.push(now);
    userChallengeRateLimits.set(userId, validRl);

    // Generate random 8-character alphanumeric code prefixed with 'PAIR-'
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const challengeCode = `PAIR-${randomHex}`;
    const expiresAt = now + CHALLENGE_LIFETIME_MS;

    const db = loadDb();
    if (!db.agentPairingChallenges) {
      db.agentPairingChallenges = [];
    }

    // Clean up expired challenges
    db.agentPairingChallenges = db.agentPairingChallenges.filter(c => c.expiresAt > now && !c.consumed);

    const challengeRecord = {
      challengeCode,
      userId,
      userDisplayName: user.name || user.email || 'Student',
      createdAt: now,
      expiresAt,
      consumed: false
    };

    db.agentPairingChallenges.push(challengeRecord);
    saveDb(db, 'agentPairingChallenges');

    logger.info(`[AgentDeviceService] Generated pairing challenge for user ${userId} (expires in 5m)`);

    return {
      challengeCode,
      expiresAt,
      lifetimeMs: CHALLENGE_LIFETIME_MS,
      userDisplayName: challengeRecord.userDisplayName
    };
  }

  /**
   * Atomically validate and consume a challenge code, issuing a scoped device credential
   */
  static async redeemChallenge(challengeCode, deviceMetadata) {
    if (!challengeCode || typeof challengeCode !== 'string') {
      return { success: false, error: 'Challenge code is required' };
    }

    const cleanCode = challengeCode.trim().toUpperCase();
    const now = Date.now();
    const db = loadDb();
    const challenges = db.agentPairingChallenges || [];

    // Find valid matching challenge
    const challengeIdx = challenges.findIndex(c => 
      c.challengeCode === cleanCode && 
      !c.consumed && 
      c.expiresAt > now
    );

    if (challengeIdx === -1) {
      return { success: false, error: 'Invalid or expired pairing code. Please generate a new code on the MUJCODE website.' };
    }

    // Atomically consume challenge
    const challenge = challenges[challengeIdx];
    challenge.consumed = true;
    challenge.consumedAt = now;
    challenges.splice(challengeIdx, 1); // Remove immediately to prevent concurrent redemption
    saveDb(db, 'agentPairingChallenges');

    // Create device credential
    const deviceId = String(deviceMetadata.deviceId || crypto.randomUUID());
    const deviceName = String(deviceMetadata.deviceName || 'Local Computer').slice(0, 100);
    const agentVersion = String(deviceMetadata.agentVersion || '1.0.0').slice(0, 20);

    // Generate high-entropy 256-bit bearer token
    const deviceToken = crypto.randomBytes(32).toString('hex');
    const deviceTokenHash = this.hashToken(deviceToken);

    if (!db.pairedDevices) {
      db.pairedDevices = [];
    }

    const deviceRecord = {
      deviceId,
      userId: challenge.userId,
      userDisplayName: challenge.userDisplayName,
      deviceTokenHash,
      deviceName,
      agentVersion,
      pairedAt: now,
      lastSeenAt: now,
      revoked: false,
      compilers: {}
    };

    const existingIdx = db.pairedDevices.findIndex(d => d.deviceId === deviceId);
    if (existingIdx !== -1) {
      db.pairedDevices[existingIdx] = deviceRecord;
    } else {
      db.pairedDevices.push(deviceRecord);
    }
    saveDb(db, 'pairedDevices');

    // Sync to PostgreSQL if connected
    if (isPostgresConnected()) {
      try {
        const pool = getPostgresPool();
        if (pool) {
          await pool.query(`
            INSERT INTO mujcode_collections (collection_name, data, updated_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (collection_name)
            DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
          `, ['pairedDevices', JSON.stringify(db.pairedDevices)]);
        }
      } catch (pgErr) {
        logger.warn(`[AgentDeviceService] PostgreSQL sync warning: ${pgErr.message}`);
      }
    }

    logger.info(`[AgentDeviceService] Device paired successfully: ${deviceId} (${deviceName}) for user ${challenge.userId}`);

    return {
      success: true,
      deviceId,
      deviceToken, // Return raw token to the agent exactly once over TLS
      userId: challenge.userId,
      userDisplayName: challenge.userDisplayName
    };
  }

  /**
   * Authenticate a connecting desktop agent using its bearer token
   */
  static async authenticateDevice(deviceToken) {
    if (!deviceToken || typeof deviceToken !== 'string') {
      return null;
    }

    const tokenHash = this.hashToken(deviceToken);
    const db = loadDb();
    const devices = db.pairedDevices || [];

    const device = devices.find(d => d.deviceTokenHash === tokenHash && !d.revoked);
    if (!device) {
      return null;
    }

    // Update last seen timestamp
    device.lastSeenAt = Date.now();
    saveDb(db, 'pairedDevices');

    return {
      deviceId: device.deviceId,
      userId: device.userId,
      deviceName: device.deviceName,
      agentVersion: device.agentVersion,
      pairedAt: device.pairedAt,
      compilers: device.compilers || {}
    };
  }

  /**
   * Update device heartbeat capabilities
   */
  static async updateHeartbeat(deviceId, compilers, agentVersion) {
    const db = loadDb();
    const devices = db.pairedDevices || [];
    const device = devices.find(d => d.deviceId === deviceId && !d.revoked);
    if (device) {
      device.lastSeenAt = Date.now();
      if (compilers && typeof compilers === 'object') {
        device.compilers = compilers;
      }
      if (agentVersion) {
        device.agentVersion = agentVersion;
      }
      saveDb(db, 'pairedDevices');
    }
  }

  /**
   * List all paired devices for a specific user (sanitized, zero secret exposure)
   */
  static async getUserDevices(userId) {
    if (!userId) return [];
    const db = loadDb();
    const devices = db.pairedDevices || [];
    const userStr = String(userId);

    return devices
      .filter(d => String(d.userId) === userStr)
      .map(d => ({
        deviceId: d.deviceId,
        deviceName: d.deviceName,
        agentVersion: d.agentVersion,
        pairedAt: d.pairedAt,
        lastSeenAt: d.lastSeenAt,
        revoked: Boolean(d.revoked),
        compilers: d.compilers || {}
      }));
  }

  /**
   * Explicitly revoke / unpair a device owned by the authenticated student
   */
  static async revokeDevice(userId, deviceId) {
    if (!userId || !deviceId) {
      return { success: false, error: 'User ID and Device ID are required' };
    }

    const userStr = String(userId);
    const devStr = String(deviceId);
    const db = loadDb();
    const devices = db.pairedDevices || [];

    let found = false;
    for (const d of devices) {
      if (d.deviceId === devStr && String(d.userId) === userStr) {
        d.revoked = true;
        d.revokedAt = Date.now();
        found = true;
      }
    }

    if (!found) {
      return { success: false, error: 'Device not found or not owned by user' };
    }
    saveDb(db, 'pairedDevices');

    logger.info(`[AgentDeviceService] Device revoked: ${deviceId} by user ${userId}`);
    return { success: true };
  }
}
