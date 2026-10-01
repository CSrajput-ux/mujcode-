import { logger } from '../lib/logger.js';

// In-memory active session tracking for Single Device Login (Feature 22)
// testId -> studentId -> { socketId, ip, loginTime }
const activeExamSessions = new Map();

// In-memory auto-save answer backup cache (Feature 13)
// testId -> studentId -> { lastSavedAt, answers: {} }
const autoSaveBackup = new Map();

export function setupExamProctorSockets(io) {
  io.on('connection', (socket) => {
    // 1. Student or Proctor Joins Test Room
    socket.on('join_test', ({ testId }) => {
      if (!testId || !socket.user) return;

      const userRole = socket.userRole;
      const verifiedUserId = socket.userId;
      const verifiedUserName = socket.userName;

      // Only verified faculty or admin can join the proctor alert broadcast room
      if (userRole === 'faculty' || userRole === 'admin') {
        const proctorRoom = `test_${testId}_proctor`;
        socket.join(proctorRoom);
        logger.info(`[ExamSocket] Proctor joined room: ${proctorRoom} (faculty: ${verifiedUserId})`);
        return;
      }

      // Students join their specific test room
      const testRoom = `test_${testId}`;
      const proctorRoom = `test_${testId}_proctor`;
      socket.join(testRoom);

      // FEATURE 22: Single Device Login Enforcement
      if (!activeExamSessions.has(testId)) {
        activeExamSessions.set(testId, new Map());
      }
      const testSessions = activeExamSessions.get(testId);

      const existingSession = testSessions.get(verifiedUserId);
      if (existingSession && existingSession.socketId !== socket.id) {
        logger.warn(`[ExamSocket] Duplicate login detected for student ${verifiedUserId}. Evicting old socket ${existingSession.socketId}`);
        io.to(existingSession.socketId).emit('force_logout', {
          reason: 'A new session was logged in from another browser/device. Only one active device session is permitted.'
        });
      }

      // Record active student session with verified user ID
      testSessions.set(verifiedUserId, {
        socketId: socket.id,
        studentName: verifiedUserName,
        loginTime: Date.now(),
        ip: socket.handshake.address
      });

      socket.testId = testId;
      socket.studentId = verifiedUserId;
      socket.studentName = verifiedUserName;

      // Broadcast student joined to Faculty Proctors
      io.to(proctorRoom).emit('student_online', {
        testId,
        studentId: verifiedUserId,
        studentName: verifiedUserName,
        socketId: socket.id,
        timestamp: Date.now()
      });
    });

    // 2. Exam Heartbeat & Timer Security (derived from verified user)
    socket.on('exam_heartbeat', (payload) => {
      if (!socket.testId || !socket.studentId) return;

      const { cheatingScore = 0, isFullscreen = true, currentQuestionId, timestamp = Date.now() } = payload || {};
      const proctorRoom = `test_${socket.testId}_proctor`;

      const serverTime = Date.now();
      const timeDrift = Math.abs(serverTime - timestamp);
      const suspiciousDrift = timeDrift > 10000; // 10s difference

      io.to(proctorRoom).emit('student_status_update', {
        testId: socket.testId,
        studentId: socket.studentId,
        studentName: socket.studentName,
        cheatingScore,
        isFullscreen,
        currentQuestionId,
        suspiciousDrift,
        lastHeartbeat: serverTime
      });
    });

    // 3. Real-time Security Violation Broadcast
    socket.on('violation_event', (payload) => {
      if (!socket.testId || !socket.studentId) return;

      const { type, message, cheatingScore = 0, fullscreenExits = 0 } = payload || {};
      const proctorRoom = `test_${socket.testId}_proctor`;

      logger.info(`[ExamSocket] Security Violation (${type}) from student ${socket.studentId} [Score: ${cheatingScore}]`);

      // Broadcast live alert to Faculty Proctor Dashboard
      io.to(proctorRoom).emit('proctor_alert', {
        testId: socket.testId,
        studentId: socket.studentId,
        studentName: socket.studentName,
        type,
        message,
        cheatingScore,
        fullscreenExits,
        timestamp: Date.now()
      });

      // Server-side enforcement check
      if (cheatingScore >= 50 || fullscreenExits >= 3) {
        logger.warn(`[ExamSocket] Threshold reached for student ${socket.studentId}. Issuing force_submit.`);
        socket.emit('force_submit', {
          reason: cheatingScore >= 50
            ? `Exam auto-submitted: Exceeded maximum Cheating Score (${cheatingScore}/50)`
            : `Exam auto-submitted: Exceeded maximum Fullscreen Exits (${fullscreenExits}/3)`
        });
      }
    });

    // 4. Auto Save Backup (locked to verified student ID)
    socket.on('auto_save_answer', (payload) => {
      if (!socket.testId || !socket.studentId) return;
      const { questionId, answer, code } = payload || {};
      if (!questionId) return;

      if (!autoSaveBackup.has(socket.testId)) {
        autoSaveBackup.set(socket.testId, new Map());
      }
      const testCache = autoSaveBackup.get(socket.testId);

      let studentCache = testCache.get(socket.studentId) || { lastSavedAt: 0, answers: {} };
      studentCache.answers[questionId] = { answer, code, updatedAt: Date.now() };
      studentCache.lastSavedAt = Date.now();
      testCache.set(socket.studentId, studentCache);

      socket.emit('save_confirmed', { questionId, timestamp: studentCache.lastSavedAt });
    });

    // 5. Faculty Proctor manual command to student — STRICT RBAC CHECK
    socket.on('proctor_command', (payload) => {
      // ONLY faculty or admin can issue proctor commands!
      if (socket.userRole !== 'faculty' && socket.userRole !== 'admin') {
        logger.warn(`[SecurityAlert] Unauthorized proctor command attempt by user ${socket.userId} (${socket.userRole})`);
        return;
      }

      const { testId, studentId, command, reason = 'Proctor intervention' } = payload || {};
      if (!testId || !studentId) return;

      const testSessions = activeExamSessions.get(testId);
      const targetSession = testSessions?.get(studentId);

      if (targetSession && targetSession.socketId) {
        if (command === 'FORCE_SUBMIT') {
          io.to(targetSession.socketId).emit('force_submit', { reason });
          logger.info(`[ExamSocket] Proctor ${socket.userId} forced submission for student ${studentId}`);
        } else if (command === 'WARN') {
          io.to(targetSession.socketId).emit('proctor_warning', { reason });
          logger.info(`[ExamSocket] Proctor ${socket.userId} warned student ${studentId}`);
        }
      }
    });

    // 6. Disconnect handling
    socket.on('disconnect', () => {
      if (socket.testId && socket.studentId) {
        const proctorRoom = `test_${socket.testId}_proctor`;
        io.to(proctorRoom).emit('student_offline', {
          testId: socket.testId,
          studentId: socket.studentId,
          timestamp: Date.now()
        });

        // Clean up active session
        const testSessions = activeExamSessions.get(socket.testId);
        if (testSessions && testSessions.get(socket.studentId)?.socketId === socket.id) {
          testSessions.delete(socket.studentId);
        }
      }
    });
  });
}
