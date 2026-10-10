import { sendJson } from '../lib/http.js';
import { nextId } from '../lib/ids.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';

export function registerLiveClassRoutes(router, ctx) {
  // GET /api/live-classes - Fetch classes based on role
  router.get('/api/live-classes', asyncHandler(requireAuth(async (req, res) => {
    const db = ctx.getDb();
    let classes = Array.isArray(db.liveClasses) ? [...db.liveClasses] : [];

    if (req.user.role === 'student') {
      const student = (db.students || []).find(s => 
        s.id === req.user.id || 
        s.college_id === req.user.college_id || 
        s.email?.toLowerCase() === req.user.email?.toLowerCase()
      );
      if (student) {
        classes = classes.filter(c => {
          const matchBranch = !c.branch || c.branch === 'All' || !student.branch || 
            String(c.branch).toLowerCase() === String(student.branch).toLowerCase();
          const matchSem = !c.semester || c.semester === 'All' || !student.semester || 
            Number(c.semester) === Number(student.semester);
          const matchSec = !c.section || c.section === 'All' || !student.section || 
            String(c.section).toUpperCase() === String(student.section).toUpperCase();
          return matchBranch && matchSem && matchSec;
        });
      }
    } else if (req.user.role === 'faculty') {
      const faculty = (db.faculty || []).find(f => 
        f.id === req.user.id || 
        f._id === req.user.id || 
        f.email?.toLowerCase() === req.user.email?.toLowerCase() ||
        f.facultyId === req.user.id ||
        (req.user.facultyId && f.facultyId === req.user.facultyId)
      );
      classes = classes.filter(c => 
        c.facultyId === req.user.id ||
        (faculty && (c.facultyId === faculty.id || c.facultyId === faculty.facultyId || (c.facultyName && c.facultyName === faculty.name)))
      );
    }
    // admin sees all classes

    // Sort by status ('Live' first, then 'Upcoming', then 'Completed') and then by date/time
    const statusWeight = { 'Live': 3, 'Upcoming': 2, 'Completed': 1 };
    classes.sort((a, b) => {
      const weightA = statusWeight[a.status] || 0;
      const weightB = statusWeight[b.status] || 0;
      if (weightA !== weightB) return weightB - weightA;

      const timeB = new Date(`${b.date} ${b.time}`).getTime() || new Date(b.date || 0).getTime() || 0;
      const timeA = new Date(`${a.date} ${a.time}`).getTime() || new Date(a.date || 0).getTime() || 0;
      return timeB - timeA;
    });

    sendJson(res, 200, { success: true, count: classes.length, data: classes });
  })));

  // POST /api/live-classes - Schedule a new class
  router.post('/api/live-classes', asyncHandler(requireRole('faculty', async (req, res) => {
    const db = ctx.getDb();
    const { subject, courseName, department, branch, semester, section, topic, date, time, duration, meetingLink } = req.body;

    if (!subject || !date || !time) {
      return sendJson(res, 400, { error: 'Subject, Date, and Time are required' });
    }

    const faculty = (db.faculty || []).find(f => 
      f.id === req.user.id || 
      f._id === req.user.id || 
      f.email?.toLowerCase() === req.user.email?.toLowerCase() ||
      f.facultyId === req.user.id ||
      (req.user.facultyId && f.facultyId === req.user.facultyId)
    );

    const facultyName = req.user.name || faculty?.name || 'Dr. Aditya Sinha';
    const facultyDepartment = department || faculty?.department || 'Department of Computer Science & Engineering';

    const newClass = {
      _id: nextId('lc'),
      facultyId: req.user.id,
      facultyName,
      subject: String(subject).trim(),
      courseName: courseName || subject,
      department: facultyDepartment,
      branch: branch || 'CSE',
      semester: semester !== undefined && semester !== '' ? Number(semester) : 5,
      section: section || 'All',
      topic: String(topic || subject).trim(),
      date,
      time,
      duration: duration ? Number(duration) : 60,
      meetingLink: meetingLink ? String(meetingLink).trim() : '',
      status: 'Upcoming',
      recordingUrl: null,
      createdAt: new Date().toISOString()
    };

    const currentClasses = Array.isArray(db.liveClasses) ? db.liveClasses : [];
    db.liveClasses = [newClass, ...currentClasses];
    ctx.saveDb(db, 'liveClasses');

    sendJson(res, 201, { success: true, data: newClass });
  })));

  // PUT /api/live-classes/:id/status - Update class status (Upcoming -> Live -> Completed)
  router.put('/api/live-classes/:id/status', asyncHandler(async (req, res) => {
    if (!req.user || (req.user.role !== 'faculty' && req.user.role !== 'admin')) {
      return sendJson(res, 403, { error: 'Forbidden: Requires faculty or admin privileges' });
    }

    const { id } = req.params;
    const { status } = req.body;
    
    if (!['Upcoming', 'Live', 'Completed'].includes(status)) {
      return sendJson(res, 400, { error: 'Invalid status. Must be Upcoming, Live, or Completed' });
    }

    const db = ctx.getDb();
    const liveClasses = Array.isArray(db.liveClasses) ? db.liveClasses : [];
    const classItem = liveClasses.find(c => c._id === id);
    
    if (!classItem) return sendJson(res, 404, { error: 'Class not found' });

    // Authorization check
    if (req.user.role === 'faculty') {
      const faculty = (db.faculty || []).find(f => 
        f.id === req.user.id || 
        f.email?.toLowerCase() === req.user.email?.toLowerCase() ||
        f.facultyId === req.user.id
      );
      const isOwner = classItem.facultyId === req.user.id || 
                      (faculty && (classItem.facultyId === faculty.id || classItem.facultyId === faculty.facultyId || classItem.facultyName === faculty.name));
      if (!isOwner) return sendJson(res, 403, { error: 'Forbidden: You can only modify your own classes' });
    }

    classItem.status = status;
    classItem.updatedAt = new Date().toISOString();

    // If marked Completed, finalize open attendance records
    if (status === 'Completed' && Array.isArray(db.classAttendance)) {
      const nowIso = new Date().toISOString();
      const nowMs = Date.now();
      db.classAttendance.forEach(a => {
        if (a.classId === id && !a.leaveTime) {
          a.leaveTime = nowIso;
          const joinMs = new Date(a.joinTime).getTime() || (nowMs - 30 * 60000);
          const diffMins = Math.max(1, Math.floor((nowMs - joinMs) / 60000));
          a.totalDurationMinutes = diffMins;
          a.status = diffMins >= 20 ? 'Present' : 'Partial';
        }
      });
      ctx.saveDb(db, 'classAttendance');
    }

    ctx.saveDb(db, 'liveClasses');
    sendJson(res, 200, { success: true, data: classItem });
  }));

  // DELETE /api/live-classes/:id - Delete / cancel a class
  router.delete('/api/live-classes/:id', asyncHandler(async (req, res) => {
    if (!req.user || (req.user.role !== 'faculty' && req.user.role !== 'admin')) {
      return sendJson(res, 403, { error: 'Forbidden: Requires faculty or admin privileges' });
    }

    const { id } = req.params;
    const db = ctx.getDb();
    const liveClasses = Array.isArray(db.liveClasses) ? db.liveClasses : [];
    const classIndex = liveClasses.findIndex(c => c._id === id);
    
    if (classIndex === -1) return sendJson(res, 404, { error: 'Class not found' });

    if (req.user.role === 'faculty') {
      const faculty = (db.faculty || []).find(f => 
        f.id === req.user.id || 
        f.email?.toLowerCase() === req.user.email?.toLowerCase() ||
        f.facultyId === req.user.id
      );
      const isOwner = liveClasses[classIndex].facultyId === req.user.id || 
                      (faculty && (liveClasses[classIndex].facultyId === faculty.id || liveClasses[classIndex].facultyName === faculty.name));
      if (!isOwner) return sendJson(res, 403, { error: 'Forbidden: You can only delete your own classes' });
    }

    const deleted = liveClasses.splice(classIndex, 1)[0];
    ctx.saveDb(db, 'liveClasses');
    sendJson(res, 200, { success: true, message: 'Class deleted successfully', data: deleted });
  }));

  // GET /api/live-classes/:id/attendance - View attendance for a class
  router.get('/api/live-classes/:id/attendance', asyncHandler(async (req, res) => {
    if (!req.user) return sendJson(res, 401, { error: 'Authentication required' });

    const { id } = req.params;
    const db = ctx.getDb();
    const liveClass = (db.liveClasses || []).find(c => c._id === id);
    if (!liveClass) return sendJson(res, 404, { error: 'Class not found' });

    const allAttendance = Array.isArray(db.classAttendance) ? db.classAttendance : [];
    const classRecords = allAttendance.filter(a => a.classId === id);

    // Enrich with student roll number, branch, section
    const enriched = classRecords.map(rec => {
      const student = (db.students || []).find(s => s.id === rec.studentId || s.college_id === rec.studentId || s.college_id === rec.studentRollNumber);
      return {
        ...rec,
        rollNumber: student?.roll_number || student?.college_id || rec.studentId,
        branch: student?.branch || '',
        section: student?.section || '',
        semester: student?.semester || ''
      };
    });

    sendJson(res, 200, {
      success: true,
      classId: id,
      topic: liveClass.topic,
      totalAttendees: enriched.length,
      presentCount: enriched.filter(e => e.status === 'Present').length,
      partialCount: enriched.filter(e => e.status === 'Partial').length,
      attendance: enriched
    });
  }));

  // POST /api/live-classes/:id/join - Student joins a live class
  router.post('/api/live-classes/:id/join', asyncHandler(requireRole('student', async (req, res) => {
    const { id } = req.params;
    const db = ctx.getDb();
    const liveClass = (db.liveClasses || []).find(c => c._id === id);
    
    if (!liveClass) return sendJson(res, 404, { error: 'Class not found' });
    if (liveClass.status !== 'Live' && liveClass.status !== 'Upcoming') {
      return sendJson(res, 400, { error: 'This class has already ended' });
    }

    const student = (db.students || []).find(s => 
      s.id === req.user.id || 
      s.college_id === req.user.college_id || 
      s.email?.toLowerCase() === req.user.email?.toLowerCase()
    );

    const studentName = req.user.name || student?.name || student?.fullName || 'Student';
    const attendanceList = Array.isArray(db.classAttendance) ? db.classAttendance : [];
    let attendanceRecord = attendanceList.find(a => a.classId === id && a.studentId === req.user.id);

    if (!attendanceRecord) {
      attendanceRecord = {
        _id: nextId('att'),
        classId: id,
        studentId: req.user.id,
        studentName,
        studentRollNumber: student?.roll_number || student?.college_id || '',
        status: 'Pending',
        joinTime: new Date().toISOString(),
        leaveTime: null,
        totalDurationMinutes: 0
      };
      attendanceList.push(attendanceRecord);
    } else {
      attendanceRecord.joinTime = new Date().toISOString();
      attendanceRecord.leaveTime = null;
    }

    db.classAttendance = attendanceList;
    ctx.saveDb(db, 'classAttendance');

    sendJson(res, 200, { 
      success: true, 
      data: attendanceRecord, 
      meetingLink: liveClass.meetingLink,
      status: liveClass.status
    });
  })));

  // POST /api/live-classes/:id/leave - Student leaves a live class
  router.post('/api/live-classes/:id/leave', asyncHandler(requireRole('student', async (req, res) => {
    const { id } = req.params;
    const db = ctx.getDb();
    const attendanceList = Array.isArray(db.classAttendance) ? db.classAttendance : [];
    const attendanceRecord = attendanceList.find(a => a.classId === id && a.studentId === req.user.id);
    
    if (!attendanceRecord) return sendJson(res, 404, { error: 'Attendance record not found' });

    attendanceRecord.leaveTime = new Date().toISOString();
    const joinTime = new Date(attendanceRecord.joinTime).getTime();
    const leaveTime = new Date(attendanceRecord.leaveTime).getTime();
    
    const diffMins = Math.max(1, Math.floor((leaveTime - joinTime) / 60000));
    attendanceRecord.totalDurationMinutes = diffMins;

    if (diffMins >= 20) {
      attendanceRecord.status = 'Present';
    } else {
      attendanceRecord.status = 'Partial';
    }

    db.classAttendance = attendanceList;
    ctx.saveDb(db, 'classAttendance');

    sendJson(res, 200, { success: true, data: attendanceRecord });
  })));
}
