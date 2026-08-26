import { badRequest, ok, sendJson } from '../lib/http.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { AuthService } from '../services/AuthService.js';

export function registerAuthRoutes(router, ctx) {
  const authService = new AuthService(ctx);

  router.post('/api/auth/login', asyncHandler(async (req, res) => {
    const { email, password, role } = req.body;
    
    if (!email || !password || !role) {
      return badRequest(res, 'email, password and role are required');
    }

    const result = await authService.login(email, password, role);
    
    // Volume 7 Security: Set HttpOnly Cookie
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = [
      `token=${result.token}`,
      `HttpOnly`,
      `Path=/`,
      `Max-Age=${24 * 60 * 60}`, // 24 hours
      isProduction ? `SameSite=Strict` : `SameSite=Lax`   // Lax allows cross-origin in dev
    ];

    if (isProduction) {
      cookieOptions.push(`Secure`);
    }

    res.setHeader('Set-Cookie', cookieOptions.join('; '));

    return ok(res, {
      success: true,
      token: result.token,   // needed by frontend localStorage → Authorization header
      user: result.user
    });
  }));

  router.post('/api/auth/change-password', asyncHandler(async (req, res) => {
    const { email, oldPassword, newPassword } = req.body;
    if (!email || !oldPassword || !newPassword) {
      return badRequest(res, 'email, oldPassword and newPassword are required');
    }

    const result = await authService.changePassword(email, oldPassword, newPassword);
    return ok(res, result);
  }));
}
