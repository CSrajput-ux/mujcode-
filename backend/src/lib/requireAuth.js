import { sendJson } from './http.js';

/**
 * Authorization Guards — Enforce server-side role checks and object-level permissions
 */

export function requireAuth(req, res, role = null) {
  if (!req.user) {
    sendJson(res, 401, { error: 'Authentication required. Please log in.' });
    return false;
  }

  if (role && req.user.role !== role && req.user.role !== 'admin') {
    sendJson(res, 403, { error: `Forbidden. This endpoint requires the "${role}" role.` });
    return false;
  }

  return true;
}

export function requireAdmin(req, res) {
  return requireAuth(req, res, 'admin');
}

export function requireFaculty(req, res) {
  return requireAnyRole(req, res, 'faculty', 'admin');
}

export function requireCompany(req, res) {
  return requireAnyRole(req, res, 'company', 'admin');
}

export function requireStudent(req, res) {
  return requireAnyRole(req, res, 'student', 'admin');
}

export function requireAnyRole(req, res, ...roles) {
  if (!req.user) {
    sendJson(res, 401, { error: 'Authentication required. Please log in.' });
    return false;
  }

  if (roles.length > 0 && !roles.includes(req.user.role) && req.user.role !== 'admin') {
    sendJson(res, 403, { error: `Forbidden. This endpoint requires one of: ${roles.join(', ')}` });
    return false;
  }

  return true;
}

/**
 * Object-level Authorization (BOLA/IDOR protection):
 * Verifies that the caller owns the targeted resource or has elevated privileges.
 */
export function requireSelfOrAdmin(req, res, targetId) {
  if (!requireAuth(req, res)) return false;

  const currentId = req.user.id;
  const currentCollegeId = req.user.college_id;
  const target = String(targetId || '').trim();

  if (
    currentId === target ||
    (currentCollegeId && currentCollegeId === target) ||
    req.user.role === 'admin'
  ) {
    return true;
  }

  sendJson(res, 403, { error: 'Forbidden. You do not have permission to access or modify this record.' });
  return false;
}

export function requireSelfOrFacultyOrAdmin(req, res, targetId) {
  if (!requireAuth(req, res)) return false;

  const currentId = req.user.id;
  const currentCollegeId = req.user.college_id;
  const target = String(targetId || '').trim();

  if (
    currentId === target ||
    (currentCollegeId && currentCollegeId === target) ||
    req.user.role === 'faculty' ||
    req.user.role === 'admin'
  ) {
    return true;
  }

  sendJson(res, 403, { error: 'Forbidden. You do not have permission to access this record.' });
  return false;
}
