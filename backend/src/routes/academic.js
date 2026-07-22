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

  if (student && student.subjects && student.subjects.length > 0) {
    const existingTitles = new Set(courses.map(c => c.courseName.toLowerCase()));
    const customCourses = student.subjects
      .filter(sub => !existingTitles.has(sub.toLowerCase()))
      .map((sub, i) => ({
        courseCode: `SUB-${i + 100}`,
        courseName: sub,
        credits: 3,
        courseType: 'Theory',
        isElective: false,
        prerequisites: [],
        syllabusOverview: ''
      }));
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
