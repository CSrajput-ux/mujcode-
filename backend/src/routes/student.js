import { ok, sendJson } from '../lib/http.js';
import { publicCourse, currentStudent, normalizeYear } from './helpers.js';

function userAndStudent(db, id) {
  const user = db.users.find(item => item.id === id || item.college_id === id);
  const student = db.students.find(item => item.id === id || item.college_id === id);
  return { user, student };
}

function updateStudentProfile(db, id, profile) {
  const { user, student } = userAndStudent(db, id);
  const patch = {
    departmentId: profile.departmentId || undefined,
    programId: profile.programId || undefined,
    branchId: profile.branchId || undefined,
    sectionId: profile.sectionId || undefined,
    academicYearId: profile.academicYearId || undefined,
    branch: profile.branch || profile.branchCode || user?.branch || student?.branch || 'CSE',
    section: profile.section || user?.section || student?.section || 'A',
    year: profile.year || user?.year || student?.year || '2',
    semester: profile.semester || user?.semester || 4,
    department: profile.department || user?.department || 'Computer Science and Engineering',
    course: profile.course || user?.course || 'B.Tech'
  };

  if (user) {
    Object.assign(user, patch, {
      StudentProfile: {
        branch: patch.branch,
        section: patch.section,
        year: `${normalizeYear(patch.year) || patch.year}${normalizeYear(patch.year) ? 'th Year' : ''}`,
        semester: Number(patch.semester || 4)
      }
    });
  }

  if (student) {
    Object.assign(student, {
      branch: patch.branch,
      section: patch.section,
      year: normalizeYear(patch.year) || patch.year,
      semester: Number(patch.semester || 4)
    });
  }

  return { ...patch, id };
}

function solvedSet(db, studentId) {
  return new Set(
    db.problemSubmissions
      .filter(sub => (sub.userId === studentId || sub.userId === String(studentId)) && sub.verdict === 'Accepted')
      .map(sub => Number(sub.problemNumber))
  );
}

function restrictionsFor(db, student) {
  if (!student) return [];
  return db.permissions.filter(block => {
    if (block.status === 'revoked') return false;
    if (block.scope === 'student') {
      return [student.id, student.college_id].includes(block.targetId);
    }
    if (block.scope === 'section') {
      return block.section === student.section && (!block.branch || block.branch === student.branch);
    }
    if (block.scope === 'course') {
      return block.section === student.section || block.section === 'all';
    }
    return false;
  });
}

export function registerStudentRoutes(router) {
  router.get('/api/student/courses', (req, res, ctx) => {
    const db = ctx.getDb();
    return sendJson(res, 200, { courses: db.courses.map(publicCourse) });
  });

  router.get('/api/student/courses/:studentId', (req, res, ctx) => {
    const db = ctx.getDb();
    const { student } = userAndStudent(db, req.params.studentId);
    const courses = db.courses
      .filter(course => !student || !course.branch || course.branch === student.branch)
      .map(publicCourse);

    return sendJson(res, 200, { courses });
  });

  router.get('/api/student/course/:courseId/details', (req, res, ctx) => {
    const db = ctx.getDb();
    const course = db.courses.find(item => item._id === req.params.courseId);
    const solved = solvedSet(db, req.query.studentId || currentStudent(db, req)?.id);
    const problems = db.problems
      .filter(problem => problem.courseId === req.params.courseId)
      .map(problem => ({
        _id: problem._id,
        number: problem.number,
        title: problem.title,
        difficulty: problem.difficulty,
        category: problem.category,
        points: problem.points,
        solved: solved.has(Number(problem.number))
      }));

    return sendJson(res, 200, {
      course: course ? publicCourse(course) : null,
      problems,
      solvedCount: problems.filter(problem => problem.solved).length
    });
  });

  router.get('/api/student/profile/:id', (req, res, ctx) => {
    const db = ctx.getDb();
    const { user, student } = userAndStudent(db, req.params.id);
    return sendJson(res, 200, {
      profile: {
        ...(user || {}),
        ...(student || {}),
        name: user?.name || student?.fullName,
        email: user?.email || student?.User?.email
      }
    });
  });

  router.put('/api/student/profile/:id', (req, res, ctx) => {
    const db = ctx.getDb();
    const profile = updateStudentProfile(db, req.params.id, req.body);
    ctx.saveDb(db);
    return ok(res, { profile });
  });

  router.put('/api/student/profile', (req, res, ctx) => {
    const db = ctx.getDb();
    const student = currentStudent(db, req);
    const profile = updateStudentProfile(db, student?.id || 'stu_1', req.body);
    ctx.saveDb(db);
    return ok(res, { profile });
  });

  router.get('/api/student/mentors/:studentId', (req, res, ctx) => {
    const db = ctx.getDb();
    const student = db.students.find(s => s.id === req.params.studentId || s.college_id === req.params.studentId);
    
    if (!student || !student.facultyMentors) {
      return sendJson(res, 200, []);
    }

    const mentors = db.faculty
      .filter(f => student.facultyMentors.includes(f.id) || student.facultyMentors.includes(f._id))
      .map(f => ({
        name: f.name,
        department: f.department,
        subject: f.designation || 'Mentor'
      }));

    return sendJson(res, 200, mentors);
  });

  router.get('/api/student/restrictions', (req, res, ctx) => {
    const db = ctx.getDb();
    const student = currentStudent(db, req);
    const details = restrictionsFor(db, student);
    const blockedFeatures = [...new Set(details.flatMap(item => item.blockedFeatures || []))];
    return sendJson(res, 200, { blockedFeatures, details });
  });

  router.get('/api/student/permissions', (req, res, ctx) => {
    const db = ctx.getDb();
    const student = currentStudent(db, req);
    const details = restrictionsFor(db, student);
    const blockedFeatures = [...new Set(details.flatMap(item => item.blockedFeatures || []))];
    return sendJson(res, 200, { blockedFeatures, details });
  });

  router.get('/api/student/rankings/:studentId', (req, res) => {
    return sendJson(res, 200, {
      ranks: []
    });
  });

  router.get('/api/student/problem-stats/:studentId', (req, res, ctx) => {
    const db = ctx.getDb();
    const solvedNumbers = solvedSet(db, req.params.studentId);
    const solvedProblems = db.problems.filter(problem => solvedNumbers.has(Number(problem.number)));
    const byDifficulty = difficultyCounts(solvedProblems);
    return sendJson(res, 200, {
      solved: byDifficulty,
      totalSolved: solvedProblems.length
    });
  });

  router.get('/api/student/badges/:studentId', (req, res, ctx) => {
    const db = ctx.getDb();
    return sendJson(res, 200, {
      badges: db.badges.filter(badge => badge.studentId === req.params.studentId)
    });
  });

  router.get('/api/student/heatmap/:studentId', (req, res) => {
    return sendJson(res, 200, []);
  });

  router.get('/api/student/analytics/trend/:studentId', (req, res) => {
    return sendJson(res, 200, { trend: [] });
  });

  router.get('/api/student/analytics/topics/:studentId', (req, res) => {
    return sendJson(res, 200, { topics: [] });
  });

  router.get('/api/student/analytics/improvement/:studentId', (req, res) => {
    return sendJson(res, 200, { areas: [] });
  });

  router.get('/api/student/analytics/summary/:studentId', (req, res) => {
    return sendJson(res, 200, {
      testsCompleted: 0,
      assignmentsSubmitted: 0,
      averageScore: 0,
      certifications: 0
    });
  });
}

function difficultyCounts(problems) {
  return problems.reduce((acc, problem) => {
    const key = problem.difficulty?.toLowerCase();
    if (key) acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, { easy: 0, medium: 0, hard: 0 });
}
