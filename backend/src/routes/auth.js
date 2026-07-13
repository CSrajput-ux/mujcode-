import { badRequest, ok, sendJson } from '../lib/http.js';
import { publicUser, signToken } from '../lib/auth.js';

export function registerAuthRoutes(router) {
  router.post('/api/auth/login', (req, res, ctx) => {
    const { email, password, role } = req.body;
    const db = ctx.getDb();
    const user = db.users.find(item =>
      item.email?.toLowerCase() === String(email || '').toLowerCase() &&
      item.role === role
    );

    if (!user || user.password !== password) {
      return sendJson(res, 401, { error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return sendJson(res, 403, { error: 'Account is inactive or pending approval' });
    }

    return ok(res, {
      token: signToken(user),
      user: publicUser(user)
    });
  });

  router.post('/api/auth/change-password', (req, res, ctx) => {
    const { email, oldPassword, newPassword } = req.body;
    if (!email || !oldPassword || !newPassword) {
      return badRequest(res, 'email, oldPassword and newPassword are required');
    }

    const db = ctx.getDb();
    const matchingUsers = db.users.filter(user =>
      user.email?.toLowerCase() === String(email).toLowerCase()
    );

    if (!matchingUsers.length || !matchingUsers.some(user => user.password === oldPassword)) {
      return sendJson(res, 401, { error: 'Current password is incorrect' });
    }

    for (const user of matchingUsers) {
      user.password = newPassword;
      user.isPasswordChanged = true;
    }

    ctx.saveDb(db);
    return ok(res, { message: 'Password changed successfully' });
  });
}
