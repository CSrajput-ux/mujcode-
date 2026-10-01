import { ok, sendJson } from '../lib/http.js';
import { publicCourse, currentStudent, normalizeYear } from './helpers.js';
import { findStudentById, findStudentByCollegeId, findFacultyById } from '../lib/fastStore.js';
import { requireAuth, requireSelfOrAdmin, requireSelfOrFacultyOrAdmin } from '../lib/requireAuth.js';

function userAndStudent(db, id) {
  const user = db.users.find(item => item.id === id || item.college_id === id);
  const student = findStudentById(id) || findStudentByCollegeId(id) || db.students.find(item => item.id === id || item.college_id === id);
  return { user, student };
}

// Allowed writable profile fields for students (prevents mass assignment of role, cgpa, branch, etc.)
const STUDENT_WRITABLE_FIELDS = ['bio', 'phone', 'contactNumber', 'github', 'githubUrl', 'linkedin', 'linkedinUrl', 'avatar', 'name', 'fullName'];

function updateStudentProfile(db, id, profile, isAdmin = false) {
  const { user, student } = userAndStudent(db, id);

  // Whitelist writable fields
  const patch = {};

  for (const field of STUDENT_WRITABLE_FIELDS) {
    if (profile[field] !== undefined) {
      patch[field] = String(profile[field]).slice(0, 500); // length sanitize
    }
  }

  // Only administrators can modify academic enrollment parameters
  if (isAdmin) {
    if (profile.branch) patch.branch = profile.branch;
    if (profile.section) patch.section = profile.section;
    if (profile.year) patch.year = normalizeYear(profile.year) || profile.year;
    if (profile.semester) patch.semester = Number(profile.semester);
    if (profile.department) patch.department = profile.department;
    if (profile.course) patch.course = profile.course;
  }

  if (user) {
    Object.assign(user, patch);
  }

  if (student) {
    Object.assign(student, patch);
  }

  return { ...patch, id };
}

function solvedSet(db, studentId) {
  return new Set(
    db.problemSubmissions
      .filter(sub => (sub.userId === studentId || sub.userId === String(studentId)) && sub.verdict === 'Accepted')
      .flatMap(sub => [String(sub.problemId), String(sub.problemNumber)].filter(Boolean))
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
    if (!requireAuth(req, res)) return;
    const db = ctx.getDb();
    return sendJson(res, 200, { courses: db.courses.map(publicCourse) });
  });

  router.get('/api/student/courses/:studentId', (req, res, ctx) => {
    if (!requireSelfOrFacultyOrAdmin(req, res, req.params.studentId)) return;
    const db = ctx.getDb();
    const { student } = userAndStudent(db, req.params.studentId);
    let courses = db.courses
      .filter(course => !student || !course.branch || course.branch === student.branch)
      .map(publicCourse);

    if (student && student.subjects && student.subjects.length > 0) {
      const existingTitles = new Set(courses.map(c => (c.courseName || c.title || '').toLowerCase()));
      const customCourses = student.subjects
        .filter(sub => !existingTitles.has((sub || '').toLowerCase()))
        .map((sub, i) => ({
          _id: `custom_sub_${student.id}_${i}`,
          title: sub,
          courseName: sub,
          category: 'General',
          difficulty: 'Medium',
          icon: 'book',
          status: 'ongoing',
          progress: 0,
          totalProblems: 0,
          problemsSolved: 0,
          courseCode: `SUB-${i + 100}`,
          enrolled: true
        }));
      courses = [...customCourses, ...courses];
    }

    return sendJson(res, 200, { courses });
  });

  router.get('/api/student/course/:courseId/details', (req, res, ctx) => {
    if (!requireAuth(req, res)) return;
    const db = ctx.getDb();
    let course = db.courses.find(item => item._id === req.params.courseId || item.courseCode === req.params.courseId || (item.courseName || item.title || '').toLowerCase() === decodeURIComponent(req.params.courseId).toLowerCase());
    if (!course) {
      const decodedTitle = decodeURIComponent(req.params.courseId);
      course = {
        _id: decodedTitle,
        id: decodedTitle,
        title: decodedTitle,
        courseName: decodedTitle,
        courseCode: 'CUSTOM',
        credits: 3,
        courseType: 'Theory',
        category: 'General',
        difficulty: 'Medium',
        description: 'Uploaded Semester Course'
      };
    }
    const solved = solvedSet(db, currentStudent(db, req)?.id || req.user.id);
    const problems = db.problems
      .filter(problem => problem.courseId === req.params.courseId)
      .map(problem => ({
        _id: problem._id,
        number: problem.number,
        title: problem.title,
        difficulty: problem.difficulty,
        category: problem.category,
        points: problem.points,
        solved: solved.has(String(problem._id)) || solved.has(String(problem.number))
      }));

    return sendJson(res, 200, {
      course: course ? publicCourse(course) : null,
      problems,
      solvedCount: problems.filter(problem => problem.solved).length
    });
  });

  router.get('/api/student/profile/:id', (req, res, ctx) => {
    if (!requireSelfOrFacultyOrAdmin(req, res, req.params.id)) return;
    const db = ctx.getDb();
    const { user, student } = userAndStudent(db, req.params.id);
    if (!user && !student) {
      return sendJson(res, 404, { error: 'Student not found' });
    }

    // Strip sensitive fields (passwords, internal flags)
    const safeUser = user ? { ...user } : {};
    delete safeUser.password;
    delete safeUser.isPasswordChanged;

    return sendJson(res, 200, {
      profile: {
        ...safeUser,
        ...(student || {}),
        name: user?.name || student?.fullName,
        email: user?.email || student?.User?.email
      }
    });
  });

  router.put('/api/student/profile/:id', (req, res, ctx) => {
    if (!requireSelfOrAdmin(req, res, req.params.id)) return;
    const db = ctx.getDb();
    const isAdmin = req.user.role === 'admin';
    const profile = updateStudentProfile(db, req.params.id, req.body || {}, isAdmin);
    ctx.saveDb(db);
    return ok(res, { profile });
  });

  router.put('/api/student/profile', (req, res, ctx) => {
    if (!requireAuth(req, res)) return;
    const db = ctx.getDb();
    const student = currentStudent(db, req);
    const targetId = student?.id || req.user.id;
    const isAdmin = req.user.role === 'admin';
    const profile = updateStudentProfile(db, targetId, req.body || {}, isAdmin);
    ctx.saveDb(db);
    return ok(res, { profile });
  });

  router.get('/api/student/mentors/:studentId', (req, res, ctx) => {
    if (!requireSelfOrFacultyOrAdmin(req, res, req.params.studentId)) return;
    const db = ctx.getDb();
    const student = findStudentById(req.params.studentId) || findStudentByCollegeId(req.params.studentId) || db.students.find(s => s.id === req.params.studentId || s.college_id === req.params.studentId);
    
    if (!student || !student.facultyMentors) {
      return sendJson(res, 200, []);
    }

    const mentors = student.facultyMentors
      .map(fId => findFacultyById(fId) || db.faculty.find(f => f.id === fId || f._id === fId))
      .filter(Boolean)
      .map(f => ({
        name: f.name,
        department: f.department,
        subject: f.designation || 'Mentor'
      }));

    return sendJson(res, 200, mentors);
  });


  router.get('/api/student/restrictions', (req, res, ctx) => {
    if (!requireAuth(req, res)) return;
    const db = ctx.getDb();
    const student = currentStudent(db, req);
    const details = restrictionsFor(db, student);
    const blockedFeatures = [...new Set(details.flatMap(item => item.blockedFeatures || []))];
    return sendJson(res, 200, { blockedFeatures, details });
  });

  router.get('/api/student/permissions', (req, res, ctx) => {
    if (!requireAuth(req, res)) return;
    const db = ctx.getDb();
    const student = currentStudent(db, req);
    const details = restrictionsFor(db, student);
    const blockedFeatures = [...new Set(details.flatMap(item => item.blockedFeatures || []))];
    return sendJson(res, 200, { blockedFeatures, details });
  });

  router.get('/api/student/rankings/:studentId', (req, res, ctx) => {
    if (!requireSelfOrFacultyOrAdmin(req, res, req.params.studentId)) return;
    const db = ctx.getDb();
    const studentId = req.params.studentId;
    const student = db.students.find(s => s.id === studentId || s.college_id === studentId);
    if (!student) {
      return sendJson(res, 200, { ranks: [] });
    }

    const solvedCounts = {};
    db.students.forEach(s => {
      solvedCounts[s.id] = 0;
    });

    const userSolvedSets = {};
    db.problemSubmissions.forEach(sub => {
      if (sub.verdict === 'Accepted') {
        const uId = sub.userId;
        if (!userSolvedSets[uId]) {
          userSolvedSets[uId] = new Set();
        }
        userSolvedSets[uId].add(sub.problemId);
      }
    });

    Object.keys(userSolvedSets).forEach(uId => {
      if (solvedCounts[uId] !== undefined) {
        solvedCounts[uId] = userSolvedSets[uId].size;
      }
    });

    const allStudents = db.students;
    const branchStudents = db.students.filter(s => s.branch === student.branch);
    const sectionStudents = db.students.filter(s => s.branch === student.branch && s.section === student.section);

    const getRank = (studentList) => {
      const list = studentList.map(s => ({
        id: s.id,
        solved: solvedCounts[s.id] || 0
      }));
      list.sort((a, b) => b.solved - a.solved);
      
      let rank = 1;
      for (let i = 0; i < list.length; i++) {
        if (i > 0 && list[i].solved < list[i - 1].solved) {
          rank = i + 1;
        }
        if (list[i].id === student.id) {
          return { rank, total: list.length };
        }
      }
      return { rank: list.length, total: list.length };
    };

    const collegeRank = getRank(allStudents);
    const branchRank = getRank(branchStudents);
    const sectionRank = getRank(sectionStudents);

    return sendJson(res, 200, {
      ranks: [
        { label: 'College Rank', value: `#${collegeRank.rank}`, total: `/ ${collegeRank.total}` },
        { label: 'Branch Rank', value: `#${branchRank.rank}`, total: `/ ${branchRank.total}` },
        { label: 'Section Rank', value: `#${sectionRank.rank}`, total: `/ ${sectionRank.total}` }
      ]
    });
  });

  router.get('/api/student/problem-stats/:studentId', (req, res, ctx) => {
    if (!requireSelfOrFacultyOrAdmin(req, res, req.params.studentId)) return;
    const db = ctx.getDb();
    const student = db.students.find(s => s.id === req.params.studentId || s.college_id === req.params.studentId);
    const actualId = student ? student.id : req.params.studentId;
    const solvedNumbers = solvedSet(db, actualId);
    const solvedProblems = db.problems.filter(problem =>
      solvedNumbers.has(String(problem._id)) || solvedNumbers.has(String(problem.number))
    );
    const byDifficulty = difficultyCounts(solvedProblems);
    return sendJson(res, 200, {
      solved: byDifficulty,
      totalSolved: solvedProblems.length
    });
  });

  router.get('/api/student/badges/:studentId', (req, res, ctx) => {
    if (!requireSelfOrFacultyOrAdmin(req, res, req.params.studentId)) return;
    const db = ctx.getDb();
    const student = db.students.find(s => s.id === req.params.studentId || s.college_id === req.params.studentId);
    const actualId = student ? student.id : req.params.studentId;
    return sendJson(res, 200, {
      badges: db.badges.filter(badge => badge.studentId === actualId || badge.studentId === student?.college_id)
    });
  });

  router.get('/api/student/heatmap/:studentId', (req, res, ctx) => {
    if (!requireSelfOrFacultyOrAdmin(req, res, req.params.studentId)) return;
    const db = ctx.getDb();
    const studentId = req.params.studentId;
    const student = db.students.find(s => s.id === studentId || s.college_id === studentId);
    const studentIds = student ? [String(student.id), String(student.college_id)] : [String(studentId)];
    const activity = {};

    const addActivity = (dateStr) => {
      if (!dateStr) return;
      const date = dateStr.split('T')[0];
      activity[date] = (activity[date] || 0) + 1;
    };

    const pSubmissions = db.problemSubmissions || [];
    pSubmissions.forEach(sub => {
      if (studentIds.includes(String(sub.userId)) || studentIds.includes(String(sub.studentId))) {
        addActivity(sub.createdAt || sub.submittedAt);
      }
    });

    const tSubmissions = db.testSubmissions || [];
    tSubmissions.forEach(sub => {
      if (studentIds.includes(String(sub.userId)) || studentIds.includes(String(sub.studentId))) {
        addActivity(sub.createdAt || sub.submittedAt || sub.submittedTime);
      }
    });

    const aSubmissions = db.assignmentSubmissions || [];
    aSubmissions.forEach(sub => {
      if (studentIds.includes(String(sub.userId)) || studentIds.includes(String(sub.studentId))) {
        addActivity(sub.createdAt || sub.submittedAt || sub.submittedTime);
      }
    });

    const result = Object.entries(activity).map(([date, count]) => ({
      date,
      count
    }));

    return sendJson(res, 200, result);
  });

  router.get('/api/student/analytics/trend/:studentId', (req, res, ctx) => {
    if (!requireSelfOrFacultyOrAdmin(req, res, req.params.studentId)) return;

    const db = ctx.getDb();
    const studentId = req.params.studentId;
    const student = db.students.find(s => s.id === studentId || s.college_id === studentId);
    if (!student) {
      return sendJson(res, 200, { trend: [] });
    }

    const studentIds = [String(student.id), String(student.college_id)];
    const submissions = (db.problemSubmissions || [])
      .filter(sub => studentIds.includes(String(sub.userId)) && sub.verdict === 'Accepted')
      .sort((a, b) => new Date(a.createdAt || a.submittedAt) - new Date(b.createdAt || b.submittedAt));

    const solvedSetObj = new Set();
    const dateMap = {};

    submissions.forEach(sub => {
      const dateStr = (sub.createdAt || sub.submittedAt || new Date().toISOString()).split('T')[0];
      solvedSetObj.add(sub.problemId);
      dateMap[dateStr] = solvedSetObj.size;
    });

    const trendData = Object.entries(dateMap).map(([date, solved]) => ({
      date,
      solved
    }));

    return sendJson(res, 200, { trend: trendData });
  });

  router.get('/api/student/analytics/topics/:studentId', (req, res, ctx) => {
    if (!requireSelfOrFacultyOrAdmin(req, res, req.params.studentId)) return;
    const db = ctx.getDb();
    const studentId = req.params.studentId;
    const student = db.students.find(s => s.id === studentId || s.college_id === studentId);
    if (!student) {
      return sendJson(res, 200, { topics: [] });
    }

    const solvedNumbers = solvedSet(db, student.id);
    const topicTotals = {};
    const topicSolved = {};

    db.problems.forEach(problem => {
      const topic = problem.topic || problem.category || 'General';
      topicTotals[topic] = (topicTotals[topic] || 0) + 1;
      
      const isSolved = solvedNumbers.has(String(problem._id)) || solvedNumbers.has(String(problem.number));
      if (isSolved) {
        topicSolved[topic] = (topicSolved[topic] || 0) + 1;
      }
    });

    const topics = Object.keys(topicTotals).map(topic => {
      const total = topicTotals[topic];
      const solved = topicSolved[topic] || 0;
      return {
        topic,
        percentage: Math.round((solved / total) * 100)
      };
    });

    return sendJson(res, 200, { topics });
  });

  router.get('/api/student/analytics/improvement/:studentId', (req, res, ctx) => {
    if (!requireSelfOrFacultyOrAdmin(req, res, req.params.studentId)) return;
    const db = ctx.getDb();
    const studentId = req.params.studentId;
    const student = db.students.find(s => s.id === studentId || s.college_id === studentId);
    if (!student) {
      return sendJson(res, 200, { areas: [] });
    }

    const solvedNumbers = solvedSet(db, student.id);
    const topicTotals = {};
    const topicSolved = {};
    const topicCategory = {};

    db.problems.forEach(problem => {
      const topic = problem.topic || problem.category || 'General';
      topicTotals[topic] = (topicTotals[topic] || 0) + 1;
      topicCategory[topic] = problem.category || 'General';

      const isSolved = solvedNumbers.has(String(problem._id)) || solvedNumbers.has(String(problem.number));
      if (isSolved) {
        topicSolved[topic] = (topicSolved[topic] || 0) + 1;
      }
    });

    const areas = Object.keys(topicTotals)
      .map(topic => {
        const total = topicTotals[topic];
        const solved = topicSolved[topic] || 0;
        const percentage = Math.round((solved / total) * 100);
        return {
          topic,
          category: topicCategory[topic],
          percentage
        };
      })
      .filter(item => item.percentage < 100)
      .sort((a, b) => a.percentage - b.percentage);

    return sendJson(res, 200, { areas });
  });

  router.get('/api/student/analytics/summary/:studentId', (req, res, ctx) => {
    if (!requireSelfOrFacultyOrAdmin(req, res, req.params.studentId)) return;
    const db = ctx.getDb();
    const studentId = req.params.studentId;
    const student = db.students.find(s => s.id === studentId || s.college_id === studentId);
    if (!student) {
      return sendJson(res, 200, {
        testsCompleted: 0,
        assignmentsSubmitted: 0,
        averageScore: 0,
        certifications: 0
      });
    }

    const studentIds = [String(student.id), String(student.college_id)];

    const tSubmissions = (db.testSubmissions || []).filter(sub =>
      studentIds.includes(String(sub.userId)) || studentIds.includes(String(sub.studentId))
    );

    const aSubmissions = (db.assignmentSubmissions || []).filter(sub =>
      studentIds.includes(String(sub.userId)) || studentIds.includes(String(sub.studentId))
    );

    let totalScorePct = 0;
    let scoreCount = 0;

    tSubmissions.forEach(sub => {
      const pct = sub.percentage || (sub.maxScore ? Math.round((sub.score / sub.maxScore) * 100) : 0);
      totalScorePct += Number(pct) || 0;
      scoreCount++;
    });

    aSubmissions.forEach(sub => {
      const pct = sub.percentage || (sub.maxMarks ? Math.round((sub.score / sub.maxMarks) * 100) : 0);
      totalScorePct += Number(pct) || 0;
      scoreCount++;
    });

    const averageScore = scoreCount > 0 ? Math.round(totalScorePct / scoreCount) : 0;
    const certifications = (db.badges || []).filter(b => studentIds.includes(String(b.studentId))).length;

    return sendJson(res, 200, {
      testsCompleted: tSubmissions.length,
      assignmentsSubmitted: aSubmissions.length,
      averageScore,
      certifications
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
