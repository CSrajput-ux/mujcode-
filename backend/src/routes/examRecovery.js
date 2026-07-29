import { sendJson } from '../lib/http.js';
import { nextId } from '../lib/ids.js';

export function registerExamRecoveryRoutes(router, ctx) {
  // 1. Save / backup exam recovery snapshot from student
  router.post('/api/exam-recovery/save', (req, res) => {
    const db = ctx.getDb();
    const { testId, studentId, answers = {}, lockedQuestionIds = [], lastSavedAt = Date.now() } = req.body || {};

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

  // 2. Restore / query exam snapshot after browser crash / reconnect
  router.get('/api/exam-recovery/restore', (req, res) => {
    const db = ctx.getDb();
    const { testId, studentId } = req.query || {};

    if (!testId || !studentId) {
      return sendJson(res, 400, { error: 'testId and studentId query parameters required' });
    }

    db.examRecoverySnapshots = db.examRecoverySnapshots || {};
    const key = `${testId}_${studentId}`;

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
