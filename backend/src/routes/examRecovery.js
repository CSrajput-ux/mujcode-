import { sendJson } from '../lib/http.js';
import { nextId } from '../lib/ids.js';
import { requireAuth, requireSelfOrAdmin } from '../lib/requireAuth.js';

export function registerExamRecoveryRoutes(router, ctx) {
  // 1. Save / backup exam recovery snapshot from student (AUTHENTICATED & SELF-LOCKED)
  router.post('/api/exam-recovery/save', (req, res) => {
    if (!requireAuth(req, res)) return;
    const db = ctx.getDb();
    const { testId, answers = {}, lockedQuestionIds = [], lastSavedAt = Date.now() } = req.body || {};

    // Prevent IDOR: caller can only save their own exam snapshot unless admin
    const callerId = req.user.id || req.user.college_id;
    const requestedStudentId = req.body?.studentId;
    const studentId = (req.user.role === 'admin' && requestedStudentId) ? requestedStudentId : callerId;

    if (!testId || !studentId) {
      return sendJson(res, 400, { error: 'testId and studentId are required' });
    }

    db.examRecoverySnapshots = db.examRecoverySnapshots || {};
    const key = `${testId}_${studentId}`;

    db.examRecoverySnapshots[key] = {
      id: nextId('rec_snap'),
      testId,
      studentId,
      answers,
      lockedQuestionIds,
      lastSavedAt,
      updatedAt: Date.now()
    };

    ctx.saveDb(db);

    return sendJson(res, 200, {
      success: true,
      key,
      lastSavedAt: db.examRecoverySnapshots[key].lastSavedAt
    });
  });

  // 2. Restore / query exam snapshot after browser crash / reconnect (AUTHENTICATED & SELF-LOCKED)
  router.get('/api/exam-recovery/restore', (req, res) => {
    if (!requireAuth(req, res)) return;
    const db = ctx.getDb();
    const { testId } = req.query || {};
    const callerId = req.user.id || req.user.college_id;
    const requestedStudentId = req.query?.studentId || callerId;

    if (!requireSelfOrAdmin(req, res, requestedStudentId)) return;

    if (!testId || !requestedStudentId) {
      return sendJson(res, 400, { error: 'testId and studentId query parameters required' });
    }

    db.examRecoverySnapshots = db.examRecoverySnapshots || {};
    const key = `${testId}_${requestedStudentId}`;

    const snapshot = db.examRecoverySnapshots[key];
    if (!snapshot) {
      return sendJson(res, 200, { success: true, exists: false, snapshot: null });
    }

    return sendJson(res, 200, {
      success: true,
      exists: true,
      snapshot
    });
  });
}

