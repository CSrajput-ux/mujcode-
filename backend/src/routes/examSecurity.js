import { sendJson } from '../lib/http.js';
import { nextId } from '../lib/ids.js';
import { requireAuth, requireAnyRole } from '../lib/requireAuth.js';
import { SecurityLog } from '../models/SecurityLog.js';

// Violation severity weight mapping
const SCORE_WEIGHTS = {
  DEVTOOLS_OPENED: 20,
  COPY_ATTEMPT: 15,
  PASTE_ATTEMPT: 15,
  CUT_ATTEMPT: 15,
  FULLSCREEN_EXIT: 10,
  WINDOW_MINIMIZE: 10,
  PRINT_SCREEN_ATTEMPT: 10,
  TAB_SWITCH: 5,
  FORBIDDEN_SHORTCUT: 5,
  MULTI_MONITOR_DETECTED: 5,
  BROWSER_ZOOM_DETECTED: 2,
  CONTEXT_MENU: 2,
  DRAG_DROP_ATTEMPT: 5,
  OFFLINE_DETECTED: 0
};

// Lightweight User-Agent parser
function parseUserAgent(uaString = '') {
  const ua = uaString.toLowerCase();
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let device = 'Desktop';

  // Detect OS
  if (ua.includes('windows nt')) os = 'Windows';
  else if (ua.includes('macintosh') || ua.includes('mac os x')) os = 'macOS';
  else if (ua.includes('android')) { os = 'Android'; device = 'Mobile'; }
  else if (ua.includes('iphone') || ua.includes('ipad')) { os = 'iOS'; device = ua.includes('ipad') ? 'Tablet' : 'Mobile'; }
  else if (ua.includes('linux')) os = 'Linux';

  // Detect Browser
  if (ua.includes('edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('opr/') || ua.includes('opera')) browser = 'Opera';
  else if (ua.includes('chrome')) browser = 'Google Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Apple Safari';
  else if (ua.includes('firefox')) browser = 'Mozilla Firefox';

  return { browser, os, device };
}

// Extract real client IP
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}

export function registerExamSecurityRoutes(router, ctx) {
  // 1. Log a single security violation from useSecureExamMode
  router.post('/api/exam-security/log-violation', async (req, res, ctx) => {
    if (!requireAuth(req, res)) return;
    const db = ctx.getDb();
    const { testId, studentId, studentName = 'Student', type, message, snapshot } = req.body || {};

    if (!testId || !studentId || !type) {
      return sendJson(res, 400, { error: 'testId, studentId, and type are required' });
    }

    // Initialize collections if needed
    db.examSecurityLogs = db.examSecurityLogs || [];
    db.examSecuritySessions = db.examSecuritySessions || [];

    const now = Date.now();
    const { browser, os, device } = parseUserAgent(req.headers['user-agent'] || '');
    const ip = getClientIp(req);
    const delta = SCORE_WEIGHTS[type] !== undefined ? SCORE_WEIGHTS[type] : 5;

    // Find or create session
    let session = db.examSecuritySessions.find(
      s => s.testId === testId && s.studentId === studentId
    );

    if (!session) {
      session = {
        id: nextId('sec_sess'),
        testId,
        studentId,
        studentName,
        totalCheatingScore: 0,
        fullscreenExits: 0,
        tabSwitches: 0,
        devToolsAttempts: 0,
        copyPasteAttempts: 0,
        status: 'ACTIVE',
        firstSeen: now,
        lastSeen: now,
        ip,
        browser,
        os,
        device
      };
      db.examSecuritySessions.push(session);
    }

    // Update session metrics
    session.totalCheatingScore = (session.totalCheatingScore || 0) + delta;
    session.lastSeen = now;
    session.ip = ip;
    session.browser = browser;
    session.os = os;
    session.device = device;

    if (type === 'FULLSCREEN_EXIT') session.fullscreenExits = (session.fullscreenExits || 0) + 1;
    if (type === 'TAB_SWITCH' || type === 'WINDOW_MINIMIZE') session.tabSwitches = (session.tabSwitches || 0) + 1;
    if (type === 'DEVTOOLS_OPENED') session.devToolsAttempts = (session.devToolsAttempts || 0) + 1;
    if (['COPY_ATTEMPT', 'PASTE_ATTEMPT', 'CUT_ATTEMPT'].includes(type)) {
      session.copyPasteAttempts = (session.copyPasteAttempts || 0) + 1;
    }

    // Create detailed log entry
    const logEntry = {
      id: nextId('sec_log'),
      testId,
      studentId,
      studentName,
      timestamp: now,
      type,
      message: message || `Violation: ${type}`,
      cheatingScoreDelta: delta,
      currentScore: session.totalCheatingScore,
      ip,
      browser,
      os,
      device,
      snapshot: snapshot || null
    };

    try {
      await SecurityLog.create(logEntry);
    } catch (e) {
      console.error('[MongoDB] Failed to save security log:', e);
    }

    // Evaluate Auto-Submit rules
    let autoSubmit = false;
    let autoSubmitReason = '';

    if (session.totalCheatingScore >= 50) {
      autoSubmit = true;
      session.status = 'AUTO_SUBMITTED';
      autoSubmitReason = `Exceeded maximum Cheating Score limit (Score: ${session.totalCheatingScore}/50).`;
    } else if (session.fullscreenExits >= 3) {
      autoSubmit = true;
      session.status = 'AUTO_SUBMITTED';
      autoSubmitReason = `Exceeded maximum Fullscreen Exits (${session.fullscreenExits}/3).`;
    } else if (session.totalCheatingScore > 20) {
      session.status = 'WARNED';
    }

    ctx.saveDb(db);

    return sendJson(res, 200, {
      success: true,
      logId: logEntry.id,
      totalCheatingScore: session.totalCheatingScore,
      status: session.status,
      autoSubmit,
      autoSubmitReason
    });
  });

  // 2. Batch log timeline events (for offline recovery sync)
  router.post('/api/exam-security/batch-logs', async (req, res, ctx) => {
    const db = ctx.getDb();
    const { testId, studentId, studentName = 'Student', logs = [] } = req.body || {};

    if (!testId || !studentId || !Array.isArray(logs)) {
      return sendJson(res, 400, { error: 'testId, studentId, and logs array are required' });
    }

    db.examSecuritySessions = db.examSecuritySessions || [];

    const { browser, os, device } = parseUserAgent(req.headers['user-agent'] || '');
    const ip = getClientIp(req);
    const now = Date.now();

    let session = db.examSecuritySessions.find(
      s => s.testId === testId && s.studentId === studentId
    );

    if (!session) {
      session = {
        id: nextId('sec_sess'),
        testId,
        studentId,
        studentName,
        totalCheatingScore: 0,
        fullscreenExits: 0,
        tabSwitches: 0,
        devToolsAttempts: 0,
        copyPasteAttempts: 0,
        status: 'ACTIVE',
        firstSeen: now,
        lastSeen: now,
        ip,
        browser,
        os,
        device
      };
      db.examSecuritySessions.push(session);
    }

    let addedScore = 0;
    const newLogs = logs.map(log => {
      const delta = SCORE_WEIGHTS[log.type] !== undefined ? SCORE_WEIGHTS[log.type] : 5;
      addedScore += delta;

      if (log.type === 'FULLSCREEN_EXIT') session.fullscreenExits = (session.fullscreenExits || 0) + 1;
      if (log.type === 'TAB_SWITCH' || log.type === 'WINDOW_MINIMIZE') session.tabSwitches = (session.tabSwitches || 0) + 1;

      return {
        id: nextId('sec_log'),
        testId,
        studentId,
        studentName,
        timestamp: log.timestamp || now,
        type: log.type,
        message: log.message,
        cheatingScoreDelta: delta,
        currentScore: (session.totalCheatingScore || 0) + addedScore,
        ip,
        browser,
        os,
        device,
        snapshot: log.snapshot || null
      };
    });

    try {
      if (newLogs.length > 0) {
        await SecurityLog.insertMany(newLogs);
      }
    } catch (e) {
      console.error('[MongoDB] Failed to batch save security logs:', e);
    }

    session.totalCheatingScore = (session.totalCheatingScore || 0) + addedScore;
    session.lastSeen = now;

    ctx.saveDb(db);

    return sendJson(res, 200, {
      success: true,
      syncedCount: logs.length,
      totalCheatingScore: session.totalCheatingScore,
      status: session.status
    });
  });

  // 3. Faculty/Proctor endpoint: Get all student sessions for a test
  router.get('/api/exam-security/test-sessions', (req, res) => {
    if (!requireAnyRole(req, res, 'faculty', 'admin')) return;
    const db = ctx.getDb();
    const { testId } = req.query || {};

    if (!testId) {
      return sendJson(res, 400, { error: 'testId query parameter required' });
    }

    const sessions = (db.examSecuritySessions || [])
      .filter(s => s.testId === testId)
      .sort((a, b) => (b.totalCheatingScore || 0) - (a.totalCheatingScore || 0));

    return sendJson(res, 200, {
      success: true,
      testId,
      totalSessions: sessions.length,
      sessions
    });
  });

  // 4. Faculty/Proctor endpoint: Get full security timeline for a student
  router.get('/api/exam-security/student-timeline', async (req, res, ctx) => {
    if (!requireAnyRole(req, res, 'faculty', 'admin')) return;
    const db = ctx.getDb();
    const { testId, studentId } = req.query || {};

    if (!testId || !studentId) return sendJson(res, 400, { error: 'Missing parameters' });

    try {
      const timeline = await SecurityLog.find({ testId, studentId }).sort({ timestamp: -1 }).lean();
      const session = (db.examSecuritySessions || []).find(
        s => s.testId === testId && s.studentId === studentId
      );

      return sendJson(res, 200, {
        success: true,
        testId,
        studentId,
        session: session || null,
        timeline
      });
    } catch (e) {
      return sendJson(res, 500, { error: 'Failed to fetch security logs' });
    }
  });

  // 5. Faculty endpoint: Reset / forgive student cheating score
  router.post('/api/exam-security/reset-session', (req, res) => {
    if (!requireAnyRole(req, res, 'faculty', 'admin')) return;
    const db = ctx.getDb();
    const { testId, studentId, reason = 'Faculty pardon' } = req.body || {};

    if (!testId || !studentId) {
      return sendJson(res, 400, { error: 'testId and studentId are required' });
    }

    const session = (db.examSecuritySessions || []).find(
      s => s.testId === testId && s.studentId === studentId
    );

    if (session) {
      session.totalCheatingScore = 0;
      session.fullscreenExits = 0;
      session.status = 'ACTIVE';
      ctx.saveDb(db);
    }

    return sendJson(res, 200, {
      success: true,
      message: `Security session reset for student ${studentId}. Reason: ${reason}`
    });
  });
}
