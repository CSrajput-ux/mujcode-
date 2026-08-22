import { ok, sendJson } from '../lib/http.js';
import { nextId } from '../lib/ids.js';

export function registerAssignmentsRoutes(router) {
  // Faculty: Apne section ke saare assignments dekho
  router.get('/api/assignments/faculty/all', (req, res, ctx) => {
    return sendJson(res, 200, ctx.getDb().assignments);
  });

  // Student: Apne section ke pending assignments dekho
  router.get('/api/assignments/student/my', (req, res, ctx) => {
    const db = ctx.getDb();
    // Try to get student info from auth token
    const userId = req.user?.id || req.user?.college_id;
    const student = db.students.find(s => s.id === userId || s.college_id === userId)
      || db.users.find(u => u.id === userId && u.role === 'student');

    if (!student) {
      // Return all assignments if student not found (fallback)
      return sendJson(res, 200, db.assignments);
    }

    const studentSection = student.section || '';
    const studentBranch = student.branch || '';

    // Filter assignments matching student's section and branch
    const myAssignments = db.assignments.filter(a => {
      const sectionMatch = !a.section || !studentSection || 
        a.section.toUpperCase() === studentSection.toUpperCase();
      const branchMatch = !a.branch || !studentBranch || 
        a.branch.toUpperCase() === studentBranch.toUpperCase();
      return sectionMatch && branchMatch;
    });

    return sendJson(res, 200, myAssignments);
  });

  // Student: Submitted assignments
  router.get('/api/assignments/student/submitted', (req, res, ctx) => {
    const db = ctx.getDb();
    const userId = req.user?.id || req.user?.college_id;
    const mySubmissions = db.assignmentSubmissions.filter(sub => 
      sub.studentId === userId || sub.studentId === String(userId)
    );
    return sendJson(res, 200, mySubmissions);
  });

  router.post('/api/assignments/seed', (req, res) => {
    return ok(res, { message: 'Assignments are already seeded' });
  });

  router.post('/api/assignments', (req, res, ctx) => {
    const db = ctx.getDb();
    const assignment = {
      _id: nextId('asgn'),
      title: req.body.title || 'New Assignment',
      description: req.body.description || '',
      type: req.body.type || 'Assignment',
      subject: req.body.subject || 'General',
      year: req.body.year || '2',
      branch: req.body.branch || 'CSE',
      section: req.body.section || 'A',
      dueDate: req.body.dueDate || new Date().toISOString().slice(0, 10),
      totalMarks: Number(req.body.totalMarks || 30),
      completedCount: 0,
      pendingCount: db.students.length,
      totalStudents: db.students.length,
      createdAt: new Date().toISOString(),
    };
    db.assignments.unshift(assignment);
    ctx.saveDb(db);
    return sendJson(res, 201, assignment);
  });

  router.get('/api/assignments/:assignmentId/submissions', (req, res, ctx) => {
    const submissions = ctx.getDb().assignmentSubmissions.filter(sub => sub.assignmentId === req.params.assignmentId);
    return sendJson(res, 200, submissions);
  });

  router.post('/api/assignments/submission/:submissionId/grade', (req, res, ctx) => {
    const db = ctx.getDb();
    const submission = db.assignmentSubmissions.find(item => item._id === req.params.submissionId);
    if (!submission) return sendJson(res, 404, { error: 'Submission not found' });

    submission.marks = Number(req.body.marks || 0);
    submission.feedback = req.body.feedback || '';
    submission.status = 'Graded';
    ctx.saveDb(db);

    return sendJson(res, 200, submission);
  });
}

