import { ok, sendJson } from '../lib/http.js';
import { nextId } from '../lib/ids.js';
import { currentUser } from './helpers.js';

export function registerFacultyRoutes(router) {
  router.get('/api/faculty/subjects-by-section', (req, res, ctx) => {
    const db = ctx.getDb();
    const result = {};
    db.students.forEach(student => {
      const sec = student.section || 'A';
      if (!result[sec]) result[sec] = new Set();
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
    const db = ctx.getDb();
    const faculty = db.faculty.find(item => item._id === req.params.id || item.id === req.params.id) || db.faculty[0];
    return sendJson(res, 200, faculty ? facultyProfileForFrontend(faculty) : {});
  });

  router.put('/api/faculty/profile/:id', (req, res, ctx) => {
    const db = ctx.getDb();
    const faculty = db.faculty.find(item => item._id === req.params.id || item.id === req.params.id) || db.faculty[0];
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
    const db = ctx.getDb();
    const user = currentUser(db, req);
    const faculty = db.faculty.find(item => item.id === user?.id) || db.faculty[0];
    const ids = faculty?.teachingCourses || [];
    const courses = db.courses
      .filter(course => ids.includes(course._id))
      .map(course => ({ _id: course._id, title: course.title, department: course.department || course.branch }));
    return sendJson(res, 200, courses);
  });

  router.get('/api/faculty/analytics/dashboard-stats/:facultyId', (req, res, ctx) => {
    const db = ctx.getDb();
    const facultyId = req.params.facultyId;
    
    // Find faculty
    const faculty = db.faculty.find(f => f.id === facultyId || f._id === facultyId);
    
    // Find assigned students
    const assignedStudents = db.students.filter(s => s.facultyMentors && s.facultyMentors.includes(facultyId));
    
    // Get unique sections from those students
    const sections = [...new Set(assignedStudents.map(s => s.section).filter(Boolean))].sort();

    return sendJson(res, 200, {
      totalStudents: assignedStudents.length,
      sections: sections.length > 0 ? sections.join(', ') : 'None',
      department: faculty ? faculty.department : '-',
      testsCreated: 0 // Mock for now or calculate if tests exist
    });
  });

  router.get('/api/faculty/analytics/section-performance', (req, res) => {
    return sendJson(res, 200, [
      { week: 'Week 1', A: 62, B: 58 },
      { week: 'Week 2', A: 68, B: 61 },
      { week: 'Week 3', A: 73, B: 67 },
      { week: 'Week 4', A: 81, B: 72 }
    ]);
  });

  router.get('/api/faculty/analytics/activity-metrics', (req, res) => {
    return sendJson(res, 200, [
      { day: 'Mon', submissions: 12 },
      { day: 'Tue', submissions: 18 },
      { day: 'Wed', submissions: 9 },
      { day: 'Thu', submissions: 21 },
      { day: 'Fri', submissions: 15 }
    ]);
  });

  router.get('/api/faculty/analytics/success-rates', (req, res) => {
    return sendJson(res, 200, [
      { name: 'Passed', value: 76 },
      { name: 'Needs Support', value: 24 }
    ]);
  });

  router.get('/api/faculty/analytics/insights', (req, res) => {
    return sendJson(res, 200, [
      'Section A improved by 13% over the last four weeks.',
      'Tree traversal problems need extra reinforcement.',
      'Assignment submissions peak on Thursdays.'
    ]);
  });

  router.post('/api/faculty/questions/create', (req, res, ctx) => {
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

  router.post('/api/faculty/questions/run', (req, res, ctx) => {
    const db = ctx.getDb();
    const submission = {
      _id: nextId('facq_sub'),
      verdict: 'Accepted',
      output: 'All faculty sample cases passed.',
      language: req.body.language,
      createdAt: new Date().toISOString()
    };
    db.facultyQuestionSubmissions.unshift(submission);
    ctx.saveDb(db);
    return sendJson(res, 200, submission);
  });

  router.get('/api/faculty/questions/submission/:submissionId', (req, res, ctx) => {
    const submission = ctx.getDb().facultyQuestionSubmissions.find(item => item._id === req.params.submissionId);
    return sendJson(res, submission ? 200 : 404, submission || { error: 'Submission not found' });
  });

  router.get('/api/faculty/questions/:id', (req, res, ctx) => {
    const question = ctx.getDb().facultyQuestions.find(item => item._id === req.params.id);
    return sendJson(res, question ? 200 : 404, question || { error: 'Question not found' });
  });

  router.get('/api/faculty/questions', (req, res, ctx) => {
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
