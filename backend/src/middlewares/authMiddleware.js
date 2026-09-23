import { sendJson } from '../lib/http.js';

/**
 * Enterprise Authentication & Authorization Middleware
 * 
 * Wraps route handlers to enforce authentication and RBAC (Role-Based Access Control)
 * Usage:
 * router.get('/admin', requireRole('admin', async (req, res, ctx) => { ... }));
 */

export const requireAuth = (handler) => async (req, res, ctx) => {
  if (!req.user) {
    return sendJson(res, 401, { error: 'Unauthorized: Invalid or missing token' });
  }
  return handler(req, res, ctx);
};

export const requireRole = (role, handler) => async (req, res, ctx) => {
  if (!req.user) {
    return sendJson(res, 401, { error: 'Unauthorized: Invalid or missing token' });
  }
  if (req.user.role !== role) {
    return sendJson(res, 403, { error: `Forbidden: Requires ${role} privileges` });
  }
  return handler(req, res, ctx);
};


