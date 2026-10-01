import bcrypt from 'bcrypt';
import { signToken, signRefreshToken, publicUser, revokeToken } from '../lib/auth.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { redis } from '../config/redis.js';
import { logger } from '../lib/logger.js';

export const BCRYPT_SALT_ROUNDS = 12;

// Pre-computed bcrypt cost 12 dummy hash for constant-time comparisons when user does not exist
// Prevents timing attacks / user enumeration
const DUMMY_HASH = '$2b$12$KIXe8w3uRjO7fQwZ4E1y8OCp1vR5H.h3sM9aY2gK4l6t8u0w2x4y6';

// Strong Password Policy: Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, 1 special character
const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_SECS = 15 * 60; // 15 minutes lockout

export class AuthService {
  constructor(ctx) {
    this.ctx = ctx;
    this.userRepo = new UserRepository(ctx);
  }

  static validatePasswordStrength(password) {
    if (!password || typeof password !== 'string') {
      return { valid: false, message: 'Password is required' };
    }
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (password.length > 128) {
      return { valid: false, message: 'Password must not exceed 128 characters' };
    }
    if (!PASSWORD_POLICY_REGEX.test(password)) {
      return {
        valid: false,
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character'
      };
    }
    return { valid: true };
  }

  async checkAccountLockout(email) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const lockoutKey = `auth:lockout:${cleanEmail}`;
    const attemptsKey = `auth:attempts:${cleanEmail}`;

    const isLocked = await redis.get(lockoutKey);
    if (isLocked) {
      const ttl = await redis.ttl(lockoutKey);
      throw {
        status: 429,
        message: `Account is temporarily locked due to too many failed login attempts. Please try again in ${Math.ceil(ttl / 60)} minutes.`
      };
    }

    return { attemptsKey, lockoutKey, cleanEmail };
  }

  async recordFailedAttempt(attemptsKey, lockoutKey) {
    try {
      const attempts = await redis.incr(attemptsKey);
      if (attempts === 1) {
        await redis.expire(attemptsKey, LOCKOUT_WINDOW_SECS);
      }
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        await redis.set(lockoutKey, '1', 'EX', LOCKOUT_WINDOW_SECS);
        await redis.del(attemptsKey);
        logger.warn(`[Security] Account locked out: ${attemptsKey}`);
      }
    } catch (err) {
      logger.error('[Auth] Failed to track login attempts in Redis:', err.message);
    }
  }

  async resetFailedAttempts(attemptsKey, lockoutKey) {
    try {
      await redis.del(attemptsKey);
      await redis.del(lockoutKey);
    } catch (err) {
      // ignore Redis cleanup error
    }
  }

  async login(email, password, role) {
    const { attemptsKey, lockoutKey } = await this.checkAccountLockout(email);

    const user = await this.userRepo.findByEmailAndRole(email, role);

    // Constant-time execution: Always compare with bcrypt to prevent user enumeration via timing
    const targetHash = user?.password && user.password.startsWith('$2') ? user.password : DUMMY_HASH;
    const isMatch = await bcrypt.compare(password, targetHash).catch(() => false);

    // If no match, or user doesn't exist, fail with identical generic error
    if (!user || !isMatch) {
      await this.recordFailedAttempt(attemptsKey, lockoutKey);
      throw { status: 401, message: 'Invalid email or password.' };
    }

    // Check account status only after verifying password
    if (!user.isActive) {
      throw { status: 403, message: 'Account is inactive. Please contact your administrator.' };
    }

    // Reset failed attempts upon successful authentication
    await this.resetFailedAttempts(attemptsKey, lockoutKey);

    return {
      token: signToken(user),
      refreshToken: signRefreshToken(user),
      user: publicUser(user)
    };
  }

  async refreshSession(refreshToken) {
    if (!refreshToken) {
      throw { status: 400, message: 'Refresh token is required' };
    }

    // verifyToken validates signature, exp, alg, iss, aud, and active revocation
    const payload = (await import('../lib/auth.js')).verifyToken(null, refreshToken);
    if (!payload || payload.type !== 'refresh') {
      throw { status: 401, message: 'Invalid or expired refresh token' };
    }

    const user = await this.userRepo.findByEmailAndRole(payload.email, payload.role);
    if (!user || !user.isActive) {
      throw { status: 403, message: 'Account is inactive or no longer exists' };
    }

    // Refresh Token Rotation: Revoke the old refresh token
    await revokeToken(refreshToken);

    // Issue a new token pair
    return {
      token: signToken(user),
      refreshToken: signRefreshToken(user),
      user: publicUser(user)
    };
  }

  async changePassword(userId, oldPassword, newPassword) {
    if (!userId) {
      throw { status: 401, message: 'Authentication required' };
    }

    // Validate strength of new password
    const policy = AuthService.validatePasswordStrength(newPassword);
    if (!policy.valid) {
      throw { status: 400, message: policy.message };
    }

    const allUsers = await this.userRepo.findAll();
    const user = allUsers.find(u => u.id === userId || u._id === userId);

    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password).catch(() => false);
    if (!isMatch) {
      throw { status: 400, message: 'Current password is incorrect' };
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    user.password = hashedNewPassword;
    user.isPasswordChanged = true;

    // Update all user records sharing this email (e.g. multi-role accounts)
    const matchingUsers = await this.userRepo.findAllByEmail(user.email);
    for (const u of matchingUsers) {
      u.password = hashedNewPassword;
      u.isPasswordChanged = true;
    }

    await this.userRepo.saveMany(matchingUsers);
    logger.info(`[Auth] Password changed securely for user ${user.id} (${user.email})`);

    return { success: true, message: 'Password changed successfully' };
  }
}
