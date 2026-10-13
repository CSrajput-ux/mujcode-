import { ok, sendJson } from '../lib/http.js';
import { nextId } from '../lib/ids.js';
import { currentUser } from './helpers.js';
import { requireAuth, requireFaculty, requireSelfOrAdmin } from '../lib/requireAuth.js';
import { findFacultyById } from '../lib/fastStore.js';
import { CodeExecutionService } from '../services/CodeExecutionService.js';

export function registerFacultyRoutes(router) {
  // Returns sections & subjects for the logged-in faculty
  // Source: students who have this faculty in their facultyMentors list (set via Excel bulk upload)
  router.get('/api/faculty/my-assignments', (req, res, ctx) => {
    if (!requireFaculty(req, res)) return;
    const db = ctx.getDb();
    const user = currentUser(db, req);
    const facultyEmail = req.user?.email || '';
    const facultyId = user?.id || user?._id || req.user?.id || req.user?._id;

    const faculty = findFacultyById(facultyId) ||
      (db.faculty || []).find(f => f.id === facultyId || f._id === facultyId || f.facultyId === facultyId) ||
      (facultyEmail ? (db.faculty || []).find(f => f.email?.toLowerCase() === facultyEmail.toLowerCase()) : null);

    const validIds = new Set([facultyId, faculty?.id, faculty?._id, faculty?.facultyId].filter(Boolean));

    // Find all students assigned to this faculty via bulk upload
    const assignedStudents = (db.students || []).filter(s =>
      s.facultyMentors && s.facultyMentors.some(m => validIds.has(m))
    );

    // Build teachingAssignments: one entry per (section, subject) combo
    const assignmentsMap = new Map(); // key: "section::subject"
    assignedStudents.forEach(student => {
      const section = student.section || '';
      const branch = student.branch || '';
      const year = student.year ? student.year + ' Year' : '';
      const semester = student.semester || '';

      const allSubjects = [
        ...(student.theorySubjects || []),
        ...(student.labSubjects || []),
        ...(student.subjects || [])
      ];

      allSubjects.forEach(subject => {
        if (!subject) return;
        const key = `${section}::${subject}`;
        if (!assignmentsMap.has(key)) {
          assignmentsMap.set(key, { section, branch, year, semester, subject });
        }
      });
    });

    const teachingAssignments = [...assignmentsMap.values()];

    // Fallback: if no students linked, use faculty's own teachingAssignments
    const result = teachingAssignments.length > 0
      ? teachingAssignments
      : (faculty?.teachingAssignments || []);

    return sendJson(res, 200, {
      teachingAssignments: result,
      name: faculty?.name || user?.name || '',
      department: faculty?.department || ''
    });
  });

  router.get('/api/faculty/subjects-by-section', (req, res, ctx) => {
    const db = ctx.getDb();
    const result = {};
    const sections = ['A', 'B', 'C', 'D', 'E', 'F'];
    sections.forEach(s => { result[s] = new Set(); });

    db.students.forEach(student => {
      const sec = student.section || 'A';
      if (!result[sec]) result[sec] = new Set();
      if (student.theorySubjects) {
        student.theorySubjects.forEach(sub => result[sec].add(sub));
      }
      if (student.labSubjects) {
        student.labSubjects.forEach(sub => result[sec].add(sub));
      }
      if (student.subjects) {
        student.subjects.forEach(sub => result[sec].add(sub));
      }
    });

    const formatted = Object.keys(result).reduce((acc, sec) => {
      acc[sec] = Array.from(result[sec]);
      return acc;
    }, {});
    return sendJson(res, 200, formatted);
  });

  router.get('/api/faculty/teaching-map', (req, res, ctx) => {
    const db = ctx.getDb();
    const year = req.query.year;
    const section = req.query.section;
    const branch = req.query.branch;

    const map = db.faculty.flatMap(faculty =>
      (faculty.teachingAssignments || [])
        .filter(assignment =>
          (!year || assignment.year === year || assignment.year?.startsWith(String(year).charAt(0))) &&
          (!section || assignment.section === section) &&
          (!branch || assignment.branch === branch)
        )
        .map(assignment => ({
          facultyId: faculty._id,
          facultyName: faculty.name,
          department: faculty.department,
          subjects: [assignment.subject],
          year: assignment.year,
          section: assignment.section,
          branch: assignment.branch
        }))
    );

    return sendJson(res, 200, map);
  });

  router.get('/api/faculty/profile/:id', (req, res, ctx) => {
    if (!requireAuth(req, res)) return;
    const db = ctx.getDb();
    const faculty = findFacultyById(req.params.id) || db.faculty.find(item => item._id === req.params.id || item.id === req.params.id) || db.faculty[0];
    return sendJson(res, 200, faculty ? facultyProfileForFrontend(faculty) : {});
  });

  router.put('/api/faculty/profile/:id', (req, res, ctx) => {
    if (!requireFaculty(req, res)) return;
    if (!requireSelfOrAdmin(req, res, req.params.id)) return;
    const db = ctx.getDb();
    const faculty = findFacultyById(req.params.id) || db.faculty.find(item => item._id === req.params.id || item.id === req.params.id) || db.faculty[0];
    if (!faculty) return sendJson(res, 404, { error: 'Faculty profile not found' });

    Object.assign(faculty, {
      department: req.body.department ?? faculty.department,
      designation: req.body.designation ?? faculty.designation,
      teachingAssignments: req.body.teachingAssignments ?? faculty.teachingAssignments
    });

    const user = db.users.find(item => item.id === faculty.id);
    if (user) {
      user.department = faculty.department;
      user.designation = faculty.designation;
    }

    ctx.saveDb(db);
    return sendJson(res, 200, facultyProfileForFrontend(faculty));
  });

  router.get('/api/faculty/courses', (req, res, ctx) => {
    if (!requireFaculty(req, res)) return;
    const db = ctx.getDb();
    const user = currentUser(db, req);
    const faculty = findFacultyById(user?.id) || db.faculty.find(item => item.id === user?.id) || db.faculty[0];
    const ids = faculty?.teachingCourses || [];
    const courses = db.courses
      .filter(course => ids.includes(course._id))
      .map(course => ({ _id: course._id, title: course.title, department: course.department || course.branch }));
    return sendJson(res, 200, courses);
  });

  router.get('/api/faculty/analytics/dashboard-stats/:facultyId', (req, res, ctx) => {
    if (!requireFaculty(req, res)) return;
    const db = ctx.getDb();
    const facultyId = req.params.facultyId;

    // Find faculty by id, _id, facultyId or email
    const faculty = findFacultyById(facultyId) ||
      (db.faculty || []).find(f => f.id === facultyId || f._id === facultyId || f.facultyId === facultyId) ||
      (req.user?.email ? (db.faculty || []).find(f => f.email?.toLowerCase() === req.user.email.toLowerCase()) : null);

    const validIds = new Set([facultyId, faculty?.id, faculty?._id, faculty?.facultyId].filter(Boolean));

    // Find assigned students (via facultyMentors field on student)
    const assignedStudents = (db.students || []).filter(s =>
      s.facultyMentors && s.facultyMentors.some(m => validIds.has(m))
    );

    // Get unique sections from those students
    const sections = [...new Set(assignedStudents.map(s => s.section).filter(Boolean))].sort();

    // Count tests created by this faculty
    const testsCreated = (db.tests || []).filter(t =>
      validIds.has(t.createdBy) || validIds.has(t.facultyId) || (faculty?.email && t.createdByEmail?.toLowerCase() === faculty.email.toLowerCase())
    ).length;

    return sendJson(res, 200, {
      totalStudents: assignedStudents.length,
      sections: sections.length > 0 ? sections.join(', ') : 'None',
      department: faculty ? (faculty.department || faculty.branch || '-') : '-',
      testsCreated
    });
  });

  // Recent activity: aggregates content uploads, assignments, live classes, tests by this faculty
  router.get('/api/faculty/recent-activity', (req, res, ctx) => {
    if (!requireFaculty(req, res)) return;
    const db = ctx.getDb();
    const facultyEmail = req.user?.email || '';
    const facultyId = req.user?.id || req.user?._id || '';
    const faculty = findFacultyById(facultyId) ||
      (db.faculty || []).find(f => f.id === facultyId || f._id === facultyId || f.facultyId === facultyId) ||
      (facultyEmail ? (db.faculty || []).find(f => f.email?.toLowerCase() === facultyEmail.toLowerCase()) : null);

    const validIds = new Set([facultyId, faculty?.id, faculty?._id, faculty?.facultyId].filter(Boolean));

    const activities = [];

    // Content uploads
    (db.content || []).forEach(item => {
      if (
        (item.uploadedBy && (item.uploadedBy.toLowerCase() === facultyEmail.toLowerCase() || validIds.has(item.uploadedBy))) ||
        validIds.has(item.facultyId)
      ) {
        activities.push({
          action: 'Uploaded Material',
          item: item.title || item.fileName || 'Untitled Material',
          time: item.createdAt || '',
          type: 'upload'
        });
      }
    });

    // Tests created
    (db.tests || []).forEach(test => {
      if (
        validIds.has(test.createdBy) ||
        validIds.has(test.facultyId) ||
        (test.createdByEmail && test.createdByEmail.toLowerCase() === facultyEmail.toLowerCase())
      ) {
        activities.push({
          action: 'Created Test',
          item: test.title || test.name || 'Untitled Test',
          time: test.createdAt || '',
          type: 'test'
        });
      }
    });

    // Assignments created
    (db.assignments || []).forEach(assignment => {
      if (
        validIds.has(assignment.createdBy) ||
        validIds.has(assignment.facultyId) ||
        (assignment.createdByEmail && assignment.createdByEmail.toLowerCase() === facultyEmail.toLowerCase())
      ) {
        activities.push({
          action: 'Created Assignment',
          item: assignment.title || 'Untitled Assignment',
          time: assignment.createdAt || '',
          type: 'assignment'
        });
      }
    });

    // Live classes
    (db.liveClasses || []).forEach(cls => {
      if (
        validIds.has(cls.facultyId) ||
        validIds.has(cls.createdBy) ||
        (cls.facultyEmail && cls.facultyEmail.toLowerCase() === facultyEmail.toLowerCase())
      ) {
        activities.push({
          action: 'Scheduled Live Class',
          item: cls.title || cls.subject || 'Live Class',
          time: cls.createdAt || cls.scheduledAt || '',
          type: 'live-class'
        });
      }
    });

    // Graded submissions
    (db.assignmentSubmissions || []).forEach(sub => {
      if (
        sub.gradedBy && (validIds.has(sub.gradedBy) || sub.gradedBy.toLowerCase() === facultyEmail.toLowerCase())
      ) {
        activities.push({
          action: 'Graded Assignment',
          item: sub.assignmentTitle || `Submission for ${sub.studentName || 'Student'}`,
          time: sub.gradedAt || sub.updatedAt || '',
          type: 'assignment'
        });
      }
    });

    // Sort by most recent first, take top 10
    activities.sort((a, b) => {
      if (!a.time && !b.time) return 0;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return new Date(b.time).getTime() - new Date(a.time).getTime();
    });

    return sendJson(res, 200, activities.slice(0, 10));
  });



  router.get('/api/faculty/analytics/section-performance', (req, res) => {
    if (!requireFaculty(req, res)) return;
    return sendJson(res, 200, [
      { week: 'Week 1', A: 62, B: 58 },
      { week: 'Week 2', A: 68, B: 61 },
      { week: 'Week 3', A: 73, B: 67 },
      { week: 'Week 4', A: 81, B: 72 }
    ]);
  });

  router.get('/api/faculty/analytics/activity-metrics', (req, res) => {
    if (!requireFaculty(req, res)) return;
    return sendJson(res, 200, [
      { day: 'Mon', submissions: 12 },
      { day: 'Tue', submissions: 18 },
      { day: 'Wed', submissions: 9 },
      { day: 'Thu', submissions: 21 },
      { day: 'Fri', submissions: 15 }
    ]);
  });

  router.get('/api/faculty/analytics/success-rates', (req, res) => {
    if (!requireFaculty(req, res)) return;
    return sendJson(res, 200, [
      { name: 'Passed', value: 76 },
      { name: 'Needs Support', value: 24 }
    ]);
  });

  router.get('/api/faculty/analytics/insights', (req, res) => {
    if (!requireFaculty(req, res)) return;
    return sendJson(res, 200, [
      'Section A improved by 13% over the last four weeks.',
      'Tree traversal problems need extra reinforcement.',
      'Assignment submissions peak on Thursdays.'
    ]);
  });

  router.post('/api/faculty/questions/create', (req, res, ctx) => {
    if (!requireFaculty(req, res)) return;
    const db = ctx.getDb();
    const question = {
      _id: nextId('facq'),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    db.facultyQuestions.unshift(question);
    ctx.saveDb(db);
    return sendJson(res, 201, question);
  });

  router.post('/api/faculty/questions/run', async (req, res, ctx) => {
    if (!requireFaculty(req, res)) return;
    const db = ctx.getDb();
    const { code, language = 'python', testCases = [] } = req.body;

    let executionResult;
    try {
      if (testCases && testCases.length > 0) {
        const testRes = await CodeExecutionService.executeTestCases({
          language,
          sourceCode: code,
          testCases,
          isSubmit: false
        });
        const failedCase = testRes.results?.find(r => !r.passed);
        executionResult = {
          verdict: testRes.passed ? 'Accepted' : (failedCase?.error || 'Wrong Answer'),
          output: testRes.compilationError || (testRes.passed ? 'All sample test cases passed.' : failedCase?.actualOutput || 'Test case failed.'),
          results: testRes.results,
          passed: testRes.passed
        };
      } else {
        const runRes = await CodeExecutionService.runCode({
          language,
          sourceCode: code,
          stdin: req.body.stdin || ''
        });
        executionResult = {
          verdict: runRes.verdict,
          output: runRes.stdout || runRes.stderr || runRes.compileOutput || (runRes.success ? 'Program executed successfully.' : 'Execution failed.'),
          passed: runRes.success
        };
      }
    } catch (err) {
      executionResult = {
        verdict: 'Execution Error',
        output: err.message || 'Execution error',
        passed: false
      };
    }

    const submission = {
      _id: nextId('facq_sub'),
      verdict: executionResult.verdict,
      output: executionResult.output,
      results: executionResult.results,
      language,
      createdAt: new Date().toISOString()
    };
    db.facultyQuestionSubmissions.unshift(submission);
    ctx.saveDb(db);
    return sendJson(res, 200, submission);
  });

  router.get('/api/faculty/questions/submission/:submissionId', (req, res, ctx) => {
    if (!requireFaculty(req, res)) return;
    const submission = ctx.getDb().facultyQuestionSubmissions.find(item => item._id === req.params.submissionId);
    return sendJson(res, submission ? 200 : 404, submission || { error: 'Submission not found' });
  });

  router.get('/api/faculty/questions/:id', (req, res, ctx) => {
    if (!requireFaculty(req, res)) return;
    const question = ctx.getDb().facultyQuestions.find(item => item._id === req.params.id);
    return sendJson(res, question ? 200 : 404, question || { error: 'Question not found' });
  });

  router.get('/api/faculty/questions', (req, res, ctx) => {
    if (!requireFaculty(req, res)) return;
    return sendJson(res, 200, ctx.getDb().facultyQuestions);
  });

}

function facultyProfileForFrontend(faculty) {
  return {
    teachingAssignments: [],
    teachingCourses: [],
    createdCourses: [],
    ...faculty
  };
}
