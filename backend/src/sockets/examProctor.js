// In-memory active session tracking for Single Device Login (Feature 22)
// testId -> studentId -> { socketId, ip, loginTime }
const activeExamSessions = new Map();

// In-memory auto-save answer backup cache (Feature 13)
// testId -> studentId -> { lastSavedAt, answers: {} }
const autoSaveBackup = new Map();

export function setupExamProctorSockets(io) {
  io.on('connection', (socket) => {
    console.log(`[ExamSocket] Connected: ${socket.id}`);

    // 1. Student or Proctor Joins Test Room
    socket.on('join_test', ({ testId, studentId, studentName, role = 'student' }) => {
      if (!testId) return;

      if (role === 'proctor' || role === 'faculty') {
        // Faculty joins the proctor alert broadcast room
        const proctorRoom = `test_${testId}_proctor`;
        socket.join(proctorRoom);
        console.log(`[ExamSocket] Proctor joined room: ${proctorRoom}`);
        return;
      }

      if (!studentId) return;

      const testRoom = `test_${testId}`;
      const proctorRoom = `test_${testId}_proctor`;
      socket.join(testRoom);

      // FEATURE 22: Single Device Login Enforcement
      if (!activeExamSessions.has(testId)) {
        activeExamSessions.set(testId, new Map());
      }
      const testSessions = activeExamSessions.get(testId);

      const existingSession = testSessions.get(studentId);
      if (existingSession && existingSession.socketId !== socket.id) {
        console.warn(`[ExamSocket] Duplicate login detected for student ${studentId}. Evicting old socket ${existingSession.socketId}`);
        // Notify old socket & disconnect
        io.to(existingSession.socketId).emit('force_logout', {
          reason: 'A new session was logged in from another browser/device. Only one active device session is permitted.'
        });
      }

      // Record active student session
      testSessions.set(studentId, {
        socketId: socket.id,
        studentName: studentName || 'Student',
        loginTime: Date.now(),
        ip: socket.handshake.address
      });

      socket.testId = testId;
      socket.studentId = studentId;
      socket.studentName = studentName;

      // Broadcast student joined to Faculty Proctors
      io.to(proctorRoom).emit('student_online', {
        testId,
        studentId,
        studentName,
        socketId: socket.id,
        timestamp: Date.now()
      });
    });

    // 2. Exam Heartbeat & Timer Security (Feature 19 & 21)
    socket.on('exam_heartbeat', (payload) => {
      const { testId, studentId, studentName, cheatingScore = 0, isFullscreen = true, currentQuestionId, timestamp = Date.now() } = payload || {};
      if (!testId || !studentId) return;

      const proctorRoom = `test_${testId}_proctor`;

      // Check timer drift (Feature 19)
      const serverTime = Date.now();
      const timeDrift = Math.abs(serverTime - timestamp);
      const suspiciousDrift = timeDrift > 10000; // 10s difference

      io.to(proctorRoom).emit('student_status_update', {
        testId,
        studentId,
        studentName,
        cheatingScore,
        isFullscreen,
        currentQuestionId,
        suspiciousDrift,
        lastHeartbeat: serverTime
      });
    });

    // 3. Real-time Security Violation Broadcast (Feature 14 & 15)
    socket.on('violation_event', (payload) => {
      const { testId, studentId, studentName, type, message, cheatingScore = 0, fullscreenExits = 0 } = payload || {};
      if (!testId || !studentId) return;

      const proctorRoom = `test_${testId}_proctor`;

      console.log(`[ExamSocket] Security Violation (${type}) from ${studentName} [Score: ${cheatingScore}]`);

      // Broadcast live alert to Faculty Proctor Dashboard
      io.to(proctorRoom).emit('proctor_alert', {
        testId,
        studentId,
        studentName,
        type,
        message,
        cheatingScore,
        fullscreenExits,
        timestamp: Date.now()
      });

      // Server-side enforcement check
      if (cheatingScore >= 50 || fullscreenExits >= 3) {
        console.warn(`[ExamSocket] Threshold reached for ${studentId}. Issuing force_submit.`);
        socket.emit('force_submit', {
          reason: cheatingScore >= 50
            ? `Exam auto-submitted: Exceeded maximum Cheating Score (${cheatingScore}/50)`
            : `Exam auto-submitted: Exceeded maximum Fullscreen Exits (${fullscreenExits}/3)`
        });
      }
    });

    // 4. Auto Save Backup (Feature 13)
    socket.on('auto_save_answer', (payload) => {
      const { testId, studentId, questionId, answer, code } = payload || {};
      if (!testId || !studentId || !questionId) return;

      if (!autoSaveBackup.has(testId)) {
        autoSaveBackup.set(testId, new Map());
      }
      const testCache = autoSaveBackup.get(testId);

      let studentCache = testCache.get(studentId) || { lastSavedAt: 0, answers: {} };
      studentCache.answers[questionId] = { answer, code, updatedAt: Date.now() };
      studentCache.lastSavedAt = Date.now();
      testCache.set(studentId, studentCache);

      socket.emit('save_confirmed', { questionId, timestamp: studentCache.lastSavedAt });
    });

    // 5. Faculty Proctor manual command to student (Warn or Force Submit)
    socket.on('proctor_command', (payload) => {
      const { testId, studentId, command, reason = 'Proctor intervention' } = payload || {};
      if (!testId || !studentId) return;

      const testSessions = activeExamSessions.get(testId);
      const targetSession = testSessions?.get(studentId);

      if (targetSession && targetSession.socketId) {
        if (command === 'FORCE_SUBMIT') {
          io.to(targetSession.socketId).emit('force_submit', { reason });
        } else if (command === 'WARN') {
          io.to(targetSession.socketId).emit('proctor_warning', { reason });
        }
      }
    });

    // 6. Disconnect handling
    socket.on('disconnect', () => {
      console.log(`[ExamSocket] Disconnected: ${socket.id}`);
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
