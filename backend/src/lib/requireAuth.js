import { sendJson } from './http.js';

/**
 * Authorization guard — ensures the request has a valid, non-expired token
 * and (optionally) the correct role.
 *
 * Usage in route files:
 *   import { requireAuth } from '../lib/requireAuth.js';
 *
 *   router.get('/api/admin/students', (req, res, ctx) => {
 *     if (!requireAuth(req, res, 'admin')) return;
 *     // ... handler logic
 *   });
 *
 * Returns `true` if the request is authorized, `false` otherwise (and sends
 * the appropriate 401/403 response automatically).
 */
export function requireAuth(req, res, role = null) {
  if (!req.user) {
    sendJson(res, 401, { error: 'Authentication required. Please log in.' });
    return false;
  }

  if (role && req.user.role !== role) {
    sendJson(res, 403, { error: `Forbidden. This endpoint requires the "${role}" role.` });
    return false;
  }

  return true;
}

/**
 * Convenience helpers for common role checks.
 */
export function requireAdmin(req, res) {
  return requireAuth(req, res, 'admin');
}

export function requireFaculty(req, res) {
  return requireAuth(req, res, 'faculty');
}

export function requireStudent(req, res) {
  return requireAuth(req, res, 'student');
}

/**
 * Allow multiple roles (e.g., both admin and faculty).
 */
export function requireAnyRole(req, res, ...roles) {
  if (!req.user) {
    sendJson(res, 401, { error: 'Authentication required. Please log in.' });
    return false;
  }

  if (roles.length > 0 && !roles.includes(req.user.role)) {
    sendJson(res, 403, { error: `Forbidden. This endpoint requires one of: ${roles.join(', ')}` });
    return false;
  }

  return true;
}
