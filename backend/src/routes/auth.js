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
      `Max-Age=${15 * 60}`, // 15 minutes access token
      `SameSite=Strict`
    ];

    if (isProduction) {
      cookieOptions.push(`Secure`);
    }

    res.setHeader('Set-Cookie', cookieOptions.join('; '));

    return ok(res, {
      success: true,
      user: result.user
      // We still return token for legacy mobile app clients if any, 
      // but web clients will use the cookie automatically.
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
