import { ok, sendJson } from '../lib/http.js';
import { currentStudent, publicCourse } from './helpers.js';

function coursesFor(db, branchCode = 'CSE', semester = 4) {
  return db.courses
    .filter(course =>
      course.branch === branchCode &&
      (!semester || Number(course.semester) === Number(semester))
    )
    .map(publicCourse);
}

function courseResponse(db, student, branchCode = 'CSE', semester = 4) {
  let courses = coursesFor(db, branchCode, semester);

  // Merge student's custom subjects into courses list
  if (student) {
    const existingTitles = new Set(courses.map(c => (c.courseName || c.title || '').toLowerCase()));

    // New: separate theorySubjects (blue) and labSubjects (green)
    const theorySubjects = (student.theorySubjects || []);
    const labSubjects = (student.labSubjects || []);

    // Legacy: old 'subjects' field — treat as Theory if not already covered
    const legacySubjects = (student.subjects || []).filter(
      sub => !theorySubjects.map(s => s.toLowerCase()).includes((sub || '').toLowerCase()) &&
             !labSubjects.map(s => s.toLowerCase()).includes((sub || '').toLowerCase())
    );

    const customCourses = [
      ...theorySubjects
        .filter(sub => !existingTitles.has((sub || '').toLowerCase()))
        .map((sub, i) => ({
          courseCode: `TH-${i + 100}`,
          courseName: sub,
          credits: 3,
          courseType: 'Theory',
          isElective: false,
          prerequisites: [],
          syllabusOverview: ''
        })),
      ...labSubjects
        .filter(sub => !existingTitles.has((sub || '').toLowerCase()))
        .map((sub, i) => ({
          courseCode: `LAB-${i + 100}`,
          courseName: sub,
          credits: 2,
          courseType: 'Lab',
          isElective: false,
          prerequisites: [],
          syllabusOverview: ''
        })),
      ...legacySubjects
        .filter(sub => !existingTitles.has((sub || '').toLowerCase()))
        .map((sub, i) => ({
          courseCode: `SUB-${i + 100}`,
          courseName: sub,
          credits: 3,
          courseType: 'Theory',
          isElective: false,
          prerequisites: [],
          syllabusOverview: ''
        }))
    ];

    courses = [...customCourses, ...courses];
  }

  const totalCredits = courses.reduce((sum, course) => sum + Number(course.credits || 0), 0);

  return {
    success: true,
    student: {
      name: student?.fullName || 'Student',
      email: student?.User?.email || '',
      branch: branchCode,
      semester,
      section: student?.section || null
    },
    summary: {
      totalCourses: courses.length,
      totalCredits,
      breakdown: {
        theory: courses.filter(course => course.courseType === 'Theory').length,
        lab: courses.filter(course => course.courseType === 'Lab').length,
        project: courses.filter(course => course.courseType === 'Project').length
      }
    },
    courses
  };
}

export function registerAcademicRoutes(router) {
  router.get('/api/academic/my-courses', (req, res, ctx) => {
    const db = ctx.getDb();
    const student = currentStudent(db, req);
    return sendJson(res, 200, courseResponse(
      db,
      student,
      student?.branch || 'CSE',
      student?.semester || 4
    ));
  });

  router.get('/api/academic/branches', (req, res, ctx) => {
    const data = ctx.getDb().branches.map(branch => ({
      code: branch.code,
      name: branch.name,
      fullName: branch.fullName,
      department: branch.department,
      specializations: branch.specializations || []
    }));
    return ok(res, { count: data.length, data });
  });

  router.get('/api/academic/courses/:branchCode/:semester', (req, res, ctx) => {
    const db = ctx.getDb();
    return sendJson(res, 200, courseResponse(db, null, req.params.branchCode, Number(req.params.semester)));
  });

  router.get('/api/academic/roadmap/:branchCode', (req, res, ctx) => {
    const db = ctx.getDb();
    const branchCode = req.params.branchCode;
    const roadmap = [1, 2, 3, 4, 5, 6, 7, 8].map(semester => ({
      semester,
      courses: db.courses
        .filter(course => course.branch === branchCode && Number(course.semester) === semester)
        .map(publicCourse)
    }));

    return ok(res, { branchCode, roadmap });
  });
}
