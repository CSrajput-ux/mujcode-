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
  return null; // Non-student users get null, not someone else's data
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

export function computeTestStatus(db, test, studentId = null) {
  if (studentId && db.testSubmissions && db.testSubmissions.some(
    sub => sub.testId === test._id && String(sub.studentId) === String(studentId)
  )) {
    return 'Completed';
  }

  if (test.startTime) {
    const startMs = new Date(test.startTime).getTime();
    if (!isNaN(startMs)) {
      const durationMinutes = Number(test.duration) || 60;
      let endMs = startMs + durationMinutes * 60 * 1000;
      if (test.endTime) {
        const parsedEnd = new Date(test.endTime).getTime();
        if (!isNaN(parsedEnd)) {
          endMs = parsedEnd;
        }
      }

      const now = Date.now();
      if (now > endMs) {
        return 'Completed';
      }
      if (now >= startMs && now <= endMs) {
        return 'Live';
      }
      if (now < startMs) {
        return 'Upcoming';
      }
    }
  }

  return test.status || 'Upcoming';
}

export function studentSafeTest(db, test, studentId = null) {
  const questions = getQuestionsForTest(db, test._id).mcq.map(question => ({
    _id: question._id,
    text: question.text || question.questionText,
    type: 'MCQ',
    options: question.options,
    marks: question.marks,
    explanation: question.explanation
  }));

  const status = computeTestStatus(db, test, studentId);

  return { ...test, status, questions };
}

export function getQuestionsForTest(db, testId) {
  return {
    mcq: (db.mcqQuestions || []).filter(question => question.testId === testId),
    coding: (db.codingQuestions || []).filter(question => question.testId === testId),
    theory: (db.theoryQuestions || []).filter(question => question.testId === testId)
  };
}

export function enrichDrive(db, drive) {
  const Company = (db.companies || []).find(company => company.id === Number(drive.companyId)) || null;
  const JobPostings = (db.jobPostings || [])
    .filter(job => Number(job.driveId) === Number(drive.id))
    .map(job => ({
      ...job,
      StudentApplications: (db.applications || []).filter(app => Number(app.jobId) === Number(job.id))
    }));

  return { ...drive, Company, JobPostings };
}

export function enrichApplication(db, application) {
  const job = (db.jobPostings || []).find(item => Number(item.id) === Number(application.jobId));
  const drive = job ? (db.placementDrives || []).find(item => Number(item.id) === Number(job.driveId)) : null;
  const company = drive ? (db.companies || []).find(item => Number(item.id) === Number(drive.companyId)) : null;

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

export function getCompanyActivityLogs(db) {
  const companyLogs = [];

  // 1. Logs from db.activityLogs strictly of type 'company'
  if (Array.isArray(db.activityLogs)) {
    for (const log of db.activityLogs) {
      if (log.type === 'company' || log.role === 'company' || log.category === 'company') {
        companyLogs.push({
          type: 'company',
          message: log.message || 'Company Action',
          detail: log.detail || '',
          createdAt: log.createdAt || log.timestamp || new Date().toISOString()
        });
      }
    }
  }

  // 2. Derive activities from Placement Drives (created/scheduled by companies)
  if (Array.isArray(db.placementDrives)) {
    for (const drive of db.placementDrives) {
      const comp = (db.companies || []).find(c =>
        String(c.id) === String(drive.companyId) || c._id === drive.companyId
      );
      const companyName = comp ? comp.name : (drive.companyName || 'Corporate Partner');
      companyLogs.push({
        type: 'company',
        message: drive.status === 'Active' || drive.status === 'Scheduled' ? 'Placement drive scheduled' : 'Placement drive updated',
        detail: `${drive.title} (${companyName})`,
        createdAt: drive.createdAt || drive.updatedAt || drive.driveDate || new Date().toISOString()
      });
    }
  }

  // 3. Derive activities from Partner Company Onboarding
  if (Array.isArray(db.companies)) {
    for (const comp of db.companies) {
      companyLogs.push({
        type: 'company',
        message: 'Partner company onboarded',
        detail: `${comp.name} registered with ${comp.loginEmail ? 'system portal access' : 'hiring catalog'}`,
        createdAt: comp.createdAt || new Date().toISOString()
      });
    }
  }

  // Sort descending by date and return top unique company activities
  const seen = new Set();
  return companyLogs
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter(item => {
      const key = `${item.message}_${item.detail}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 50);
}

export function systemHealth(ctx, db) {
  const uptimeSeconds = Math.floor((Date.now() - ctx.startedAt.getTime()) / 1000);
  return {
    activityLogs: getCompanyActivityLogs(db),
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
