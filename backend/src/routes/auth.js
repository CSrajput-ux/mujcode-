import { badRequest, ok, sendJson } from '../lib/http.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { AuthService } from '../services/AuthService.js';
import { requireAuth } from '../lib/requireAuth.js';
import { authRateLimiter } from '../middlewares/rateLimiter.js';
import { revokeToken } from '../lib/auth.js';

export function registerAuthRoutes(router, ctx) {
  const authService = new AuthService(ctx);

  /**
   * POST /api/auth/login
   * Authenticate user with rate limiting, lockout protection, and generic error responses
   */
  router.post('/api/auth/login', asyncHandler(async (req, res) => {
    // 1. Rate limiting check
    const rateLimited = await authRateLimiter(req, res);
    if (rateLimited) return;

    const { email, password, role } = req.body || {};

    if (!email || !password || !role) {
      return badRequest(res, 'email, password and role are required');
    }

    const result = await authService.login(email, password, role);

    const isProduction = process.env.NODE_ENV === 'production';
    const isSecureConnection = req.headers['x-forwarded-proto'] === 'https' || isProduction;

    // Secure HttpOnly Cookie options
    const accessCookie = [
      `token=${encodeURIComponent(result.token)}`,
      'HttpOnly',
      'Path=/',
      `Max-Age=${15 * 60}`, // 15 minutes
      isProduction ? 'SameSite=Strict' : 'SameSite=Lax'
    ];

    const refreshCookie = [
      `refreshToken=${encodeURIComponent(result.refreshToken)}`,
      'HttpOnly',
      'Path=/',
      `Max-Age=${7 * 24 * 60 * 60}`, // 7 days
      isProduction ? 'SameSite=Strict' : 'SameSite=Lax'
    ];

    if (isSecureConnection) {
      accessCookie.push('Secure');
      refreshCookie.push('Secure');
    }

    res.setHeader('Set-Cookie', [accessCookie.join('; '), refreshCookie.join('; ')]);

    return ok(res, {
      success: true,
      token: result.token,
      refreshToken: result.refreshToken,
      user: result.user
    });
  }));

  /**
   * POST /api/auth/refresh
   * Refresh session using refresh token rotation
   */
  router.post('/api/auth/refresh', asyncHandler(async (req, res) => {
    // Extract refresh token from cookie or body
    let refreshToken = null;
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      const match = cookieHeader.match(/(?:^|;\s*)refreshToken=([^;]*)/);
      if (match) refreshToken = decodeURIComponent(match[1]);
    }
    if (!refreshToken && req.body?.refreshToken) {
      refreshToken = req.body.refreshToken;
    }

    if (!refreshToken) {
      return sendJson(res, 401, { error: 'Refresh token not found' });
    }

    const result = await authService.refreshSession(refreshToken);

    const isProduction = process.env.NODE_ENV === 'production';
    const isSecureConnection = req.headers['x-forwarded-proto'] === 'https' || isProduction;

    const accessCookie = [
      `token=${encodeURIComponent(result.token)}`,
      'HttpOnly',
      'Path=/',
      `Max-Age=${15 * 60}`,
      isProduction ? 'SameSite=Strict' : 'SameSite=Lax'
    ];

    const refreshCookie = [
      `refreshToken=${encodeURIComponent(result.refreshToken)}`,
      'HttpOnly',
      'Path=/',
      `Max-Age=${7 * 24 * 60 * 60}`,
      isProduction ? 'SameSite=Strict' : 'SameSite=Lax'
    ];

    if (isSecureConnection) {
      accessCookie.push('Secure');
      refreshCookie.push('Secure');
    }

    res.setHeader('Set-Cookie', [accessCookie.join('; '), refreshCookie.join('; ')]);

    return ok(res, {
      success: true,
      token: result.token,
      refreshToken: result.refreshToken,
      user: result.user
    });
  }));

  /**
   * POST /api/auth/logout
   * Invalidate current token and clear cookies
   */
  router.post('/api/auth/logout', asyncHandler(async (req, res) => {
    // Revoke token if present
    const rawToken = req.headers.authorization?.replace(/^Bearer\s+/, '') || req.headers['x-auth-token'];
    if (rawToken) {
      await revokeToken(rawToken);
    }

    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      const refreshMatch = cookieHeader.match(/(?:^|;\s*)refreshToken=([^;]*)/);
      if (refreshMatch) {
        await revokeToken(decodeURIComponent(refreshMatch[1]));
      }
    }

    // Expire cookies immediately
    const clearAccess = 'token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax';
    const clearRefresh = 'refreshToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax';
    res.setHeader('Set-Cookie', [clearAccess, clearRefresh]);

    return ok(res, { success: true, message: 'Logged out successfully' });
  }));

  /**
   * GET /api/auth/me
   * Get current authenticated user details
   */
  router.get('/api/auth/me', asyncHandler(async (req, res) => {
    if (!requireAuth(req, res)) return;
    return ok(res, { success: true, user: req.user });
  }));

  /**
   * POST /api/auth/change-password
   * Secure password change: enforces authentication, verifies old password, and applies complexity rules
   */
  router.post('/api/auth/change-password', asyncHandler(async (req, res) => {
    if (!requireAuth(req, res)) return;

    const { oldPassword, newPassword } = req.body || {};
    if (!oldPassword || !newPassword) {
      return badRequest(res, 'oldPassword and newPassword are required');
    }

    const result = await authService.changePassword(req.user.id, oldPassword, newPassword);
    return ok(res, result);
  }));

  /**
   * POST /api/auth/admin/mfa/setup
   * Initiate Admin Two-Factor Authentication setup (generates Base32 secret, OTP URI, and backup codes)
   */
  router.post('/api/auth/admin/mfa/setup', asyncHandler(async (req, res) => {
    if (!requireAuth(req, res, 'admin')) return;
    const result = await authService.setupAdminMfa(req.user.id);
    return ok(res, { success: true, ...result });
  }));

  /**
   * POST /api/auth/admin/mfa/verify-setup
   * Confirm initial 6-digit TOTP code to permanently activate MFA on admin account
   */
  router.post('/api/auth/admin/mfa/verify-setup', asyncHandler(async (req, res) => {
    if (!requireAuth(req, res, 'admin')) return;
    const { token } = req.body || {};
    if (!token) {
      return badRequest(res, '6-digit TOTP token is required');
    }

    const result = await authService.verifyAndEnableAdminMfa(req.user.id, token);
    return ok(res, result);
  }));

  /**
   * POST /api/auth/admin/mfa/verify
   * Verify TOTP code or backup recovery code during admin login
   */
  router.post('/api/auth/admin/mfa/verify', asyncHandler(async (req, res) => {
    const rateLimited = await authRateLimiter(req, res);
    if (rateLimited) return;

    const { mfaToken, token, backupCode } = req.body || {};
    if (!mfaToken) {
      return badRequest(res, 'mfaToken is required');
    }
    if (!token && !backupCode) {
      return badRequest(res, 'Either 6-digit token or backupCode must be provided');
    }

    const result = await authService.verifyAdminMfaLogin(mfaToken, token, backupCode);

    const isProduction = process.env.NODE_ENV === 'production';
    const isSecureConnection = req.headers['x-forwarded-proto'] === 'https' || isProduction;

    const accessCookie = [
      `token=${encodeURIComponent(result.token)}`,
      'HttpOnly',
      'Path=/',
      `Max-Age=${15 * 60}`,
      isProduction ? 'SameSite=Strict' : 'SameSite=Lax'
    ];

    const refreshCookie = [
      `refreshToken=${encodeURIComponent(result.refreshToken)}`,
      'HttpOnly',
      'Path=/',
      `Max-Age=${7 * 24 * 60 * 60}`,
      isProduction ? 'SameSite=Strict' : 'SameSite=Lax'
    ];

    if (isSecureConnection) {
      accessCookie.push('Secure');
      refreshCookie.push('Secure');
    }

    res.setHeader('Set-Cookie', [accessCookie.join('; '), refreshCookie.join('; ')]);

    return ok(res, {
      success: true,
      token: result.token,
      refreshToken: result.refreshToken,
      user: result.user
    });
  }));

  /**
   * POST /api/auth/admin/mfa/disable
   * Disable Admin MFA with password and current TOTP token
   */
  router.post('/api/auth/admin/mfa/disable', asyncHandler(async (req, res) => {
    if (!requireAuth(req, res, 'admin')) return;
    const { password, token } = req.body || {};
    if (!password || !token) {
      return badRequest(res, 'password and 6-digit TOTP token are required');
    }

    const result = await authService.disableAdminMfa(req.user.id, password, token);
    return ok(res, result);
  }));
}
