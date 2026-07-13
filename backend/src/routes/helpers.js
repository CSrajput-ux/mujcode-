import { nextNumber } from '../lib/ids.js';

export function currentUser(db, req) {
  if (!req.user) return null;
  return db.users.find(user => user.id === req.user.id && user.role === req.user.role) || null;
}

export function currentStudent(db, req) {
  const user = currentUser(db, req);
  if (user?.role === 'student') {
    return db.students.find(student => student.id === user.id || student.college_id === user.college_id) || null;
  }

  return db.students[0] || null;
}

export function normalizeYear(year) {
  if (!year) return '';
  return String(year).replace(/[^0-9]/g, '') || String(year);
}

export function studentForAdmin(student) {
  return {
    ...student,
    fullName: student.fullName || student.User?.name,
    college_id: student.college_id || student.rollNumber,
    User: student.User || {
      name: student.fullName,
      email: student.email,
      isActive: true
    }
  };
}

export function publicCourse(course) {
  return {
    ...course,
    courseName: course.courseName || course.title,
    title: course.title || course.courseName
  };
}

export function studentSafeTest(db, test) {
  const questions = getQuestionsForTest(db, test._id).mcq.map(question => ({
    _id: question._id,
    text: question.text || question.questionText,
    type: 'MCQ',
    options: question.options,
    marks: question.marks,
    explanation: question.explanation
  }));

  return { ...test, questions };
}

export function getQuestionsForTest(db, testId) {
  return {
    mcq: db.mcqQuestions.filter(question => question.testId === testId),
    coding: db.codingQuestions.filter(question => question.testId === testId),
    theory: db.theoryQuestions.filter(question => question.testId === testId)
  };
}

export function enrichDrive(db, drive) {
  const Company = db.companies.find(company => company.id === Number(drive.companyId)) || null;
  const JobPostings = db.jobPostings
    .filter(job => Number(job.driveId) === Number(drive.id))
    .map(job => ({
      ...job,
      StudentApplications: db.applications.filter(app => Number(app.jobId) === Number(job.id))
    }));

  return { ...drive, Company, JobPostings };
}

export function enrichApplication(db, application) {
  const job = db.jobPostings.find(item => Number(item.id) === Number(application.jobId));
  const drive = job ? db.placementDrives.find(item => Number(item.id) === Number(job.driveId)) : null;
  const company = drive ? db.companies.find(item => Number(item.id) === Number(drive.companyId)) : null;

  return {
    ...application,
    JobPosting: {
      ...job,
      PlacementDrive: {
        ...drive,
        Company: company || {}
      }
    }
  };
}

export function nextNumericId(db, collectionName) {
  return nextNumber(db[collectionName] || [], 'id');
}

export function dashboardStats(db) {
  return {
    totalStudents: db.students.length,
    studentGrowthPercent: 12,
    totalFaculty: db.faculty.length,
    facultyGrowthPercent: 6,
    totalCompanies: db.companies.length,
    companyGrowthPercent: 8,
    activePlacements: db.placementDrives.filter(drive => ['Scheduled', 'Ongoing'].includes(drive.status)).length,
    placementGrowthPercent: 15
  };
}

export function systemHealth(ctx, db) {
  const uptimeSeconds = Math.floor((Date.now() - ctx.startedAt.getTime()) / 1000);
  return {
    activityLogs: db.activityLogs.slice(0, 10),
    systemHealth: {
      success: true,
      health: {
        database: {
          mongo: { status: 'Healthy' },
          postgres: { status: 'Healthy' }
        },
        api: { status: 'Healthy' },
        workers: { status: 'Online' }
      }
    },
    uptime: {
      success: true,
      uptime: {
        seconds: uptimeSeconds,
        percentage: 99.9
      }
    },
    platformStats: {
      success: true,
      stats: {
        testsCount: db.tests.length,
        problemsSolved: db.problemSubmissions.filter(sub => sub.verdict === 'Accepted').length,
        activeSessions: 7,
        coursesActive: db.courses.length
      }
    }
  };
}
