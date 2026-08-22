import { sendJson, sendText } from '../lib/http.js';
import { nextId } from '../lib/ids.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';

export function registerLiveClassRoutes(router, ctx) {
  // GET /api/live-classes - Fetch classes based on role
  router.get('/api/live-classes', asyncHandler(requireAuth(async (req, res) => {
      const db = ctx.getDb();

      let classes = db.liveClasses || [];

      if (req.user.role === 'student') {
        const student = (db.students || []).find(s => s.id === req.user.id);
        if (student) {
          classes = classes.filter(c => 
            (!c.branch || c.branch === student.branch) &&
            (!c.semester || c.semester === student.semester) &&
            (!c.section || c.section === student.section)
          );
        }
      } else if (req.user.role === 'faculty') {
        classes = classes.filter(c => c.facultyId === req.user.id);
      }

      classes.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));

      sendJson(res, 200, { success: true, count: classes.length, data: classes });
  })));

  // POST /api/live-classes - Schedule a new class
  router.post('/api/live-classes', asyncHandler(requireRole('faculty', async (req, res) => {
      const { subject, courseName, department, branch, semester, section, topic, date, time, duration, meetingLink } = req.body;

      if (!subject || !date || !time) {
        return sendJson(res, 400, { error: 'Subject, Date, and Time are required' });
      }

      const facultyName = req.user.name || 'Unknown Faculty';

      const newClass = {
        _id: nextId('lc'),
        facultyId: req.user.id,
        facultyName,
        subject,
        courseName,
        department,
        branch,
        semester,
        section,
        topic,
        date,
        time,
        duration: duration || 60,
        meetingLink: meetingLink || '',
        status: 'Upcoming',
        recordingUrl: null,
        createdAt: new Date().toISOString()
      };

      ctx.saveDb({
        ...ctx.getDb(),
        liveClasses: [...(ctx.getDb().liveClasses || []), newClass]
      });

      sendJson(res, 201, { success: true, data: newClass });
  })));

  // PUT /api/live-classes/:id/status - Update class status
  router.put('/api/live-classes/:id/status', asyncHandler(requireRole('faculty', async (req, res) => {
      const { id } = req.params;
      const { status } = req.body;
      
      const db = ctx.getDb();
      const liveClasses = db.liveClasses || [];
      const classIndex = liveClasses.findIndex(c => c._id === id);
      
      if (classIndex === -1) return sendJson(res, 404, { error: 'Class not found' });
      if (liveClasses[classIndex].facultyId !== req.user.id) return sendJson(res, 403, { error: 'Forbidden' });

      liveClasses[classIndex].status = status;

      ctx.saveDb({ ...db, liveClasses });
      sendJson(res, 200, { success: true, data: liveClasses[classIndex] });
  })));

  // POST /api/live-classes/:id/join - Join a class
  router.post('/api/live-classes/:id/join', asyncHandler(requireRole('student', async (req, res) => {
      const { id } = req.params;
      const db = ctx.getDb();
      const liveClass = (db.liveClasses || []).find(c => c._id === id);
      
      if (!liveClass) return sendJson(res, 404, { error: 'Class not found' });
      if (liveClass.status !== 'Live') return sendJson(res, 400, { error: 'Class is not live' });

      const attendanceList = db.classAttendance || [];
      let attendanceRecord = attendanceList.find(a => a.classId === id && a.studentId === req.user.id);

      if (!attendanceRecord) {
        attendanceRecord = {
          _id: nextId('att'),
          classId: id,
          studentId: req.user.id,
          studentName: req.user.name || 'Student',
          status: 'Pending',
          joinTime: new Date().toISOString(),
          leaveTime: null,
          totalDurationMinutes: 0
        };
        attendanceList.push(attendanceRecord);
        ctx.saveDb({ ...db, classAttendance: attendanceList });
      } else if (!attendanceRecord.joinTime) {
        attendanceRecord.joinTime = new Date().toISOString();
        ctx.saveDb({ ...db, classAttendance: attendanceList });
      }

      sendJson(res, 200, { success: true, data: attendanceRecord, meetingLink: liveClass.meetingLink });
  })));

  // POST /api/live-classes/:id/leave - Leave a class
  router.post('/api/live-classes/:id/leave', asyncHandler(requireRole('student', async (req, res) => {
      const { id } = req.params;
      const db = ctx.getDb();
      const attendanceList = db.classAttendance || [];
      const attendanceRecord = attendanceList.find(a => a.classId === id && a.studentId === req.user.id);
      
      if (!attendanceRecord) return sendJson(res, 404, { error: 'Attendance record not found' });

      attendanceRecord.leaveTime = new Date().toISOString();
      const joinTime = new Date(attendanceRecord.joinTime);
      const leaveTime = new Date(attendanceRecord.leaveTime);
      
      const diffMins = Math.floor((leaveTime - joinTime) / 60000);
      attendanceRecord.totalDurationMinutes = diffMins;

      if (diffMins >= 20) {
        attendanceRecord.status = 'Present';
      } else {
        attendanceRecord.status = 'Partial';
      }

      ctx.saveDb({ ...db, classAttendance: attendanceList });
      sendJson(res, 200, { success: true, data: attendanceRecord });
  })));
}
