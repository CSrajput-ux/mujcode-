import { ok, sendJson } from '../lib/http.js';
import { nextId } from '../lib/ids.js';

function ensurePermissionRequests(db) {
  if (Array.isArray(db.permissionRequests)) {
    return { requests: db.permissionRequests, created: false };
  }

  const fallbackCourse = db.courses[0] || {
    _id: 'course_1',
    title: 'Data Structures',
    department: 'Computer Science and Engineering'
  };
  const students = db.students.slice(0, 2);

  db.permissionRequests = students.map((student, index) => ({
    _id: nextId('preq'),
    studentId: student.college_id || student.rollNumber || student.id,
    studentName: student.fullName || student.User?.name || 'Student',
    courseId: {
      _id: fallbackCourse._id,
      title: fallbackCourse.title || fallbackCourse.courseName,
      department: fallbackCourse.department || fallbackCourse.branch || 'Computer Science and Engineering'
    },
    section: student.section || 'A',
    requestedAt: new Date(Date.now() - index * 86400000).toISOString(),
    status: 'pending'
  }));

  return { requests: db.permissionRequests, created: true };
}

function filterPermissionRequests(requests, query) {
  return requests.filter(request =>
    (!query.status || request.status === query.status) &&
    (!query.section || request.section === query.section)
  );
}

export function registerPermissionsRoutes(router) {
  router.post('/api/permissions/block', (req, res, ctx) => {
    const db = ctx.getDb();
    const block = {
      _id: nextId('perm'),
      scope: req.body.scope || 'student',
      targetId: req.body.targetId,
      targetName: req.body.targetName || req.body.targetId,
      branch: req.body.branch || 'NA',
      section: req.body.section || 'NA',
      blockedFeatures: req.body.blockedFeatures || [],
      reason: req.body.reason || 'Faculty restriction',
      status: 'active',
      createdAt: new Date().toISOString()
    };

    db.permissions.unshift(block);
    ctx.saveDb(db);
    return sendJson(res, 201, block);
  });

  router.get('/api/permissions', (req, res, ctx) => {
    const db = ctx.getDb();
    const { requests, created } = ensurePermissionRequests(db);
    if (created) ctx.saveDb(db);
    return sendJson(res, 200, filterPermissionRequests(requests, req.query));
  });

  router.get('/api/permissions/blocks', (req, res, ctx) => {
    return sendJson(res, 200, ctx.getDb().permissions.filter(block => block.status !== 'revoked'));
  });

  router.patch('/api/permissions/:id/status', (req, res, ctx) => {
    const db = ctx.getDb();
    const { requests } = ensurePermissionRequests(db);
    const request = requests.find(item => item._id === req.params.id);
    if (request) {
      request.status = req.body.status || request.status;
      ctx.saveDb(db);
      return sendJson(res, 200, request);
    }

    const block = db.permissions.find(item => item._id === req.params.id);
    if (!block) return sendJson(res, 404, { error: 'Permission block not found' });
    block.status = req.body.status || block.status;
    ctx.saveDb(db);
    return sendJson(res, 200, block);
  });

  router.delete('/api/permissions/:id', (req, res, ctx) => {
    const db = ctx.getDb();
    const block = db.permissions.find(item => item._id === req.params.id);
    if (block) block.status = 'revoked';
    ctx.saveDb(db);
    return ok(res, { message: 'Restriction revoked' });
  });
}
