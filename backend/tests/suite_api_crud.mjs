import { apiRequest, recordTest } from './test_helper.mjs';

export async function runApiCrudSuite(tokens) {
  console.log('\n==================================================');
  console.log('--- 2. RUNNING CORE API CRUD & WORKFLOW SUITE ---');
  console.log('==================================================\n');

  const { adminToken, facultyToken, studentToken } = tokens;
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };
  const facultyHeaders = { Authorization: `Bearer ${facultyToken}` };
  const studentHeaders = { Authorization: `Bearer ${studentToken}` };

  // ─── University APIs ───────────────────────────────────────────────────────
  // TC-UNIV-001: Faculties list
  const u1 = await apiRequest('GET', '/api/university/faculties');
  recordTest({
    testId: 'TC-UNIV-001',
    reqId: 'REQ-UNIV-01',
    module: 'University',
    feature: 'Faculties Metadata',
    testType: 'Positive',
    priority: 'Medium',
    input: 'GET /api/university/faculties',
    expectedResult: 'HTTP 200 array of faculties',
    actualResult: `HTTP ${u1.status}, count: ${Array.isArray(u1.body) ? u1.body.length : 'N/A'}`,
    statusCode: u1.status,
    result: u1.status === 200 && Array.isArray(u1.body) ? 'PASS' : 'FAIL',
    duration: u1.duration
  });

  // TC-UNIV-002: Departments list
  const u2 = await apiRequest('GET', '/api/university/departments');
  recordTest({
    testId: 'TC-UNIV-002',
    reqId: 'REQ-UNIV-01',
    module: 'University',
    feature: 'Departments Metadata',
    testType: 'Positive',
    priority: 'Medium',
    input: 'GET /api/university/departments',
    expectedResult: 'HTTP 200 array of departments',
    actualResult: `HTTP ${u2.status}, count: ${Array.isArray(u2.body) ? u2.body.length : 'N/A'}`,
    statusCode: u2.status,
    result: u2.status === 200 && Array.isArray(u2.body) ? 'PASS' : 'FAIL',
    duration: u2.duration
  });

  // TC-UNIV-003: Branches list with filter
  const u3 = await apiRequest('GET', '/api/university/branches?progId=1');
  recordTest({
    testId: 'TC-UNIV-003',
    reqId: 'REQ-UNIV-01',
    module: 'University',
    feature: 'Branches Metadata Filtered',
    testType: 'Positive / Query',
    priority: 'Medium',
    input: 'GET /api/university/branches?progId=1',
    expectedResult: 'HTTP 200 array of branches matching program 1',
    actualResult: `HTTP ${u3.status}`,
    statusCode: u3.status,
    result: u3.status === 200 && Array.isArray(u3.body) ? 'PASS' : 'FAIL',
    duration: u3.duration
  });

  // ─── Academic APIs ─────────────────────────────────────────────────────────
  // TC-ACAD-001: My Courses (Student authenticated)
  const ac1 = await apiRequest('GET', '/api/academic/my-courses', null, studentHeaders);
  recordTest({
    testId: 'TC-ACAD-001',
    reqId: 'REQ-ACAD-01',
    module: 'Academic',
    feature: 'Student My Courses',
    testType: 'Positive',
    priority: 'High',
    input: 'GET /api/academic/my-courses with Student Token',
    expectedResult: 'HTTP 200 with course breakdown and credit calculation',
    actualResult: `HTTP ${ac1.status}, totalCredits: ${ac1.body?.summary?.totalCredits}`,
    statusCode: ac1.status,
    result: ac1.status === 200 && ac1.body?.success && Array.isArray(ac1.body?.courses) ? 'PASS' : 'FAIL',
    duration: ac1.duration
  });

  // TC-ACAD-002: Roadmap for Branch
  const ac2 = await apiRequest('GET', '/api/academic/roadmap/CSE');
  recordTest({
    testId: 'TC-ACAD-002',
    reqId: 'REQ-ACAD-01',
    module: 'Academic',
    feature: 'Branch Semester Roadmap',
    testType: 'Positive',
    priority: 'Medium',
    input: 'GET /api/academic/roadmap/CSE',
    expectedResult: 'HTTP 200 with 8 semesters roadmap',
    actualResult: `HTTP ${ac2.status}, semesters: ${ac2.body?.roadmap?.length}`,
    statusCode: ac2.status,
    result: ac2.status === 200 && Array.isArray(ac2.body?.roadmap) ? 'PASS' : 'FAIL',
    duration: ac2.duration
  });

  // ─── Student Profile & Analytics ───────────────────────────────────────────
  // TC-STUD-001: Student Profile by ID
  const st1 = await apiRequest('GET', '/api/student/profile/stu_mrj6pzoe_ln2wlm', null, studentHeaders);
  recordTest({
    testId: 'TC-STUD-001',
    reqId: 'REQ-STUD-01',
    module: 'Student',
    feature: 'Student Profile Lookup',
    testType: 'Positive',
    priority: 'High',
    input: 'GET /api/student/profile/stu_mrj6pzoe_ln2wlm',
    expectedResult: 'HTTP 200 student profile object',
    actualResult: `HTTP ${st1.status}`,
    statusCode: st1.status,
    result: st1.status === 200 ? 'PASS' : 'FAIL',
    duration: st1.duration
  });

  // TC-STUD-002: Student Mentors Lookup
  const st2 = await apiRequest('GET', '/api/student/mentors/stu_ms1ekbqs_o95s87', null, studentHeaders);
  recordTest({
    testId: 'TC-STUD-002',
    reqId: 'REQ-STUD-01',
    module: 'Student',
    feature: 'Student Mentors',
    testType: 'Positive',
    priority: 'Medium',
    input: 'GET /api/student/mentors/stu_ms1ekbqs_o95s87',
    expectedResult: 'HTTP 200 with array of assigned faculty mentors',
    actualResult: `HTTP ${st2.status}, mentors: ${Array.isArray(st2.body?.mentors) ? st2.body.mentors.length : 'none'}`,
    statusCode: st2.status,
    result: st2.status === 200 ? 'PASS' : 'FAIL',
    duration: st2.duration
  });

  // ─── Coding Problems APIs ──────────────────────────────────────────────────
  // TC-PROB-001: Problems List and Filter
  const pr1 = await apiRequest('GET', '/api/problems?difficulty=Easy');
  recordTest({
    testId: 'TC-PROB-001',
    reqId: 'REQ-PROB-01',
    module: 'Problems',
    feature: 'Problem Bank Difficulty Filtering',
    testType: 'Positive',
    priority: 'High',
    input: 'GET /api/problems?difficulty=Easy',
    expectedResult: 'HTTP 200 array of problems matching Easy',
    actualResult: `HTTP ${pr1.status}, count: ${pr1.body?.problems?.length}`,
    statusCode: pr1.status,
    result: pr1.status === 200 && Array.isArray(pr1.body?.problems) ? 'PASS' : 'FAIL',
    duration: pr1.duration
  });

  // TC-PROB-002: Problem Stats
  const pr2 = await apiRequest('GET', '/api/problems/stats');
  recordTest({
    testId: 'TC-PROB-002',
    reqId: 'REQ-PROB-01',
    module: 'Problems',
    feature: 'Problem Bank Stats',
    testType: 'Positive',
    priority: 'Medium',
    input: 'GET /api/problems/stats',
    expectedResult: 'HTTP 200 with total counts for easy, medium, hard',
    actualResult: `HTTP ${pr2.status}, stats: ${JSON.stringify(pr2.body?.total)}`,
    statusCode: pr2.status,
    result: pr2.status === 200 && pr2.body?.total ? 'PASS' : 'FAIL',
    duration: pr2.duration
  });

  // ─── Test Management Lifecycle (Faculty + Student) ─────────────────────────
  // TC-TEST-001: Faculty Creates a Test
  let createdTestId = null;
  const ts1 = await apiRequest('POST', '/api/tests/create', {
    title: 'Automated QA Comprehensive Test',
    description: 'Automated verification test',
    type: 'Exam',
    testType: 'MCQ',
    duration: 45,
    totalMarks: 50,
    branch: 'CSE',
    section: 'A',
    semester: 4,
    proctored: true
  }, facultyHeaders);
  if (ts1.status === 201 && ts1.body?.test?._id) {
    createdTestId = ts1.body.test._id;
  }
  recordTest({
    testId: 'TC-TEST-001',
    reqId: 'REQ-TEST-01',
    module: 'Tests',
    feature: 'Faculty Create Test',
    testType: 'Positive / Lifecycle',
    priority: 'Critical',
    input: { title: 'Automated QA Comprehensive Test', branch: 'CSE' },
    expectedResult: 'HTTP 201 Created with test._id and redirectUrl',
    actualResult: `HTTP ${ts1.status}, testId: ${createdTestId}`,
    statusCode: ts1.status,
    result: ts1.status === 201 && createdTestId ? 'PASS' : 'FAIL',
    duration: ts1.duration
  });

  // TC-TEST-002: Add MCQ Question to Test
  let createdQId = null;
  if (createdTestId) {
    const ts2 = await apiRequest('POST', `/api/tests/${createdTestId}/questions/mcq`, {
      questionText: 'What is the time complexity of binary search?',
      options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'],
      correctAnswers: [2],
      marks: 5,
      explanation: 'Binary search halves the search space each step.'
    }, facultyHeaders);
    if (ts2.status === 201 && ts2.body?._id) {
      createdQId = ts2.body._id;
    }
    recordTest({
      testId: 'TC-TEST-002',
      reqId: 'REQ-TEST-01',
      module: 'Tests',
      feature: 'Add MCQ Question to Test',
      testType: 'Positive / Lifecycle',
      priority: 'High',
      input: { testId: createdTestId, questionText: 'What is the time complexity...' },
      expectedResult: 'HTTP 201 Created with question._id',
      actualResult: `HTTP ${ts2.status}, qId: ${createdQId}`,
      statusCode: ts2.status,
      result: ts2.status === 201 && createdQId ? 'PASS' : 'FAIL',
      duration: ts2.duration
    });
  }

  // TC-TEST-003: Student View Questions (Answers must be sanitized)
  if (createdTestId) {
    const ts3 = await apiRequest('GET', `/api/tests/${createdTestId}/questions/mcq/student`, null, studentHeaders);
    const hasAnswers = ts3.body?.some?.(q => q.correctAnswers !== undefined || q.explanation !== undefined);
    recordTest({
      testId: 'TC-TEST-003',
      reqId: 'REQ-TEST-02',
      module: 'Tests',
      feature: 'Student Question Retrieval Sanitization',
      testType: 'Security / Data Masking',
      priority: 'Critical',
      input: `GET /api/tests/${createdTestId}/questions/mcq/student`,
      expectedResult: 'HTTP 200, correctAnswers and explanation strictly stripped',
      actualResult: `HTTP ${ts3.status}, answersLeaked: ${hasAnswers}`,
      statusCode: ts3.status,
      result: ts3.status === 200 && !hasAnswers ? 'PASS' : 'FAIL',
      duration: ts3.duration,
      errorMessage: hasAnswers ? 'CRITICAL: Student endpoint leaked correct answers!' : null
    });
  }

  // TC-TEST-004: Student Submits Test
  if (createdTestId && createdQId) {
    const ts4 = await apiRequest('POST', '/api/tests/submit', {
      testId: createdTestId,
      studentId: 'stu_mrj6pzoe_ln2wlm',
      answers: [
        { questionId: createdQId, selectedOption: 2 } // Option 2 is correct
      ]
    }, studentHeaders);
    const passed = (ts4.status === 201 || ts4.status === 200) && ts4.body?.score === 5;
    recordTest({
      testId: 'TC-TEST-004',
      reqId: 'REQ-TEST-03',
      module: 'Tests',
      feature: 'Student Test Submission & Auto-Grading',
      testType: 'Positive / Functional',
      priority: 'Critical',
      input: { testId: createdTestId, answers: [{ questionId: createdQId, selectedOption: 2 }] },
      expectedResult: 'HTTP 201/200, graded score: 5, status: Pass',
      actualResult: `HTTP ${ts4.status}, score: ${ts4.body?.score}, status: ${ts4.body?.status}`,
      statusCode: ts4.status,
      result: passed ? 'PASS' : 'FAIL',
      duration: ts4.duration,
      errorMessage: passed ? null : `Expected score 5, got ${ts4.body?.score}`
    });
  }

  // ─── Assignments Lifecycle ─────────────────────────────────────────────────
  // TC-ASGN-001: Student My Assignments
  const as1 = await apiRequest('GET', '/api/assignments/student/my', null, studentHeaders);
  recordTest({
    testId: 'TC-ASGN-001',
    reqId: 'REQ-ASGN-01',
    module: 'Assignments',
    feature: 'Student Assignment Filtering by Section',
    testType: 'Positive',
    priority: 'High',
    input: 'GET /api/assignments/student/my with student token',
    expectedResult: 'HTTP 200 array of assignments matching section',
    actualResult: `HTTP ${as1.status}, count: ${Array.isArray(as1.body) ? as1.body.length : 'none'}`,
    statusCode: as1.status,
    result: as1.status === 200 && Array.isArray(as1.body) ? 'PASS' : 'FAIL',
    duration: as1.duration
  });

  // ─── Permissions & Blocking ────────────────────────────────────────────────
  // TC-PERM-001: Create Permission Block
  const pm1 = await apiRequest('POST', '/api/permissions/block', {
    scope: 'student',
    targetId: 'stu_test_target',
    targetName: 'Test Student',
    branch: 'CSE',
    section: 'A',
    blockedFeatures: ['compiler', 'tests'],
    reason: 'Suspicious proctoring flag'
  }, facultyHeaders);
  const blockId = pm1.body?._id;
  recordTest({
    testId: 'TC-PERM-001',
    reqId: 'REQ-PERM-01',
    module: 'Permissions',
    feature: 'Faculty Apply Feature Block',
    testType: 'Positive / Functional',
    priority: 'High',
    input: { scope: 'student', blockedFeatures: ['compiler', 'tests'] },
    expectedResult: 'HTTP 201 Created with permission block id',
    actualResult: `HTTP ${pm1.status}, id: ${blockId}`,
    statusCode: pm1.status,
    result: pm1.status === 201 && blockId ? 'PASS' : 'FAIL',
    duration: pm1.duration
  });

  // TC-PERM-002: Revoke Permission Block
  if (blockId) {
    const pm2 = await apiRequest('DELETE', `/api/permissions/${blockId}`, null, facultyHeaders);
    recordTest({
      testId: 'TC-PERM-002',
      reqId: 'REQ-PERM-01',
      module: 'Permissions',
      feature: 'Faculty Revoke Feature Block',
      testType: 'Positive / Functional',
      priority: 'High',
      input: `DELETE /api/permissions/${blockId}`,
      expectedResult: 'HTTP 200 Restriction revoked',
      actualResult: `HTTP ${pm2.status}`,
      statusCode: pm2.status,
      result: pm2.status === 200 ? 'PASS' : 'FAIL',
      duration: pm2.duration
    });
  }

  // ─── Live Classes ──────────────────────────────────────────────────────────
  // TC-LIVE-001: Faculty Schedules Live Class
  let liveClassId = null;
  const lc1 = await apiRequest('POST', '/api/live-classes', {
    subject: 'Computer Networks',
    courseName: 'Computer Networks',
    department: 'CSE',
    branch: 'CSE',
    semester: 5,
    section: 'E',
    topic: 'TCP Handshake & Congestion Control',
    date: '2026-09-20',
    time: '10:00 AM',
    duration: 60,
    meetingLink: 'https://meet.google.com/abc-defg-hij'
  }, facultyHeaders);
  if (lc1.status === 201 && lc1.body?.data?._id) {
    liveClassId = lc1.body.data._id;
  }
  recordTest({
    testId: 'TC-LIVE-001',
    reqId: 'REQ-LIVE-01',
    module: 'Live Classes',
    feature: 'Schedule Live Classroom',
    testType: 'Positive / Functional',
    priority: 'High',
    input: { subject: 'Computer Networks', topic: 'TCP Handshake...' },
    expectedResult: 'HTTP 201 Created with live class object',
    actualResult: `HTTP ${lc1.status}, id: ${liveClassId}`,
    statusCode: lc1.status,
    result: lc1.status === 201 && liveClassId ? 'PASS' : 'FAIL',
    duration: lc1.duration
  });

  // TC-LIVE-002: Student Join Live Class when NOT live
  if (liveClassId) {
    const lc2 = await apiRequest('POST', `/api/live-classes/${liveClassId}/join`, null, studentHeaders);
    recordTest({
      testId: 'TC-LIVE-002',
      reqId: 'REQ-LIVE-01',
      module: 'Live Classes',
      feature: 'Student Join Non-Live Class Guard',
      testType: 'Negative / Boundary',
      priority: 'Medium',
      input: `POST /api/live-classes/${liveClassId}/join on Upcoming class`,
      expectedResult: 'HTTP 400 Bad Request (Class is not live)',
      actualResult: `HTTP ${lc2.status}: ${lc2.body?.error}`,
      statusCode: lc2.status,
      result: lc2.status === 400 ? 'PASS' : 'FAIL',
      duration: lc2.duration
    });
  }

  // ─── Admin Portal APIs ─────────────────────────────────────────────────────
  // TC-ADMN-001: Admin Dashboard Stats
  const ad1 = await apiRequest('GET', '/api/admin/dashboard/stats', null, adminHeaders);
  recordTest({
    testId: 'TC-ADMN-001',
    reqId: 'REQ-ADMN-01',
    module: 'Admin',
    feature: 'Dashboard Stats Aggregate',
    testType: 'Positive',
    priority: 'Critical',
    input: 'GET /api/admin/dashboard/stats with Admin Token',
    expectedResult: 'HTTP 200 with totalStudents, totalFaculty, totalCompanies',
    actualResult: `HTTP ${ad1.status}, students: ${ad1.body?.data?.totalStudents}`,
    statusCode: ad1.status,
    result: ad1.status === 200 && ad1.body?.data?.totalStudents !== undefined ? 'PASS' : 'FAIL',
    duration: ad1.duration
  });

  // TC-ADMN-002: Admin Create Student with Zod validation
  const ad2 = await apiRequest('POST', '/api/admin/students', {
    name: 'New Test Student',
    email: `test_stu_${Date.now()}@muj.manipal.edu`,
    rollNumber: `ROLL_${Date.now().toString().slice(-6)}`,
    branch: 'CSE',
    section: 'B',
    year: '2',
    semester: 3
  }, adminHeaders);
  recordTest({
    testId: 'TC-ADMN-002',
    reqId: 'REQ-ADMN-01',
    module: 'Admin',
    feature: 'Admin Add Student with Zod Schema Validation',
    testType: 'Positive / Schema Validation',
    priority: 'High',
    input: { name: 'New Test Student', branch: 'CSE' },
    expectedResult: 'HTTP 201 Created with new student entity',
    actualResult: `HTTP ${ad2.status}, id: ${ad2.body?.student?._id || ad2.body?._id}`,
    statusCode: ad2.status,
    result: ad2.status === 201 ? 'PASS' : 'FAIL',
    duration: ad2.duration
  });

  // TC-ADMN-003: Admin Add Student Invalid Email Zod Rejection
  const ad3 = await apiRequest('POST', '/api/admin/students', {
    name: 'Invalid Email Student',
    email: 'not-an-email',
    rollNumber: 'ROLL_INVALID'
  }, adminHeaders);
  recordTest({
    testId: 'TC-ADMN-003',
    reqId: 'REQ-ADMN-01',
    module: 'Admin',
    feature: 'Admin Add Student Invalid Email Schema Guard',
    testType: 'Validation / Negative',
    priority: 'High',
    input: { name: 'Invalid Email Student', email: 'not-an-email' },
    expectedResult: 'HTTP 400 Bad Request with Zod email validation error',
    actualResult: `HTTP ${ad3.status}: ${ad3.body?.error}`,
    statusCode: ad3.status,
    result: ad3.status === 400 ? 'PASS' : 'FAIL',
    duration: ad3.duration
  });

  // ─── System Metrics & Health ───────────────────────────────────────────────
  // TC-SYST-001: Prometheus Metrics Endpoint
  const sy1 = await apiRequest('GET', '/metrics');
  const hasProm = sy1.rawText?.includes('http_requests_total') || sy1.rawText?.includes('process_cpu_user_seconds_total');
  recordTest({
    testId: 'TC-SYST-001',
    reqId: 'REQ-STOR-01',
    module: 'System',
    feature: 'Prometheus Metrics Exposition',
    testType: 'Observability',
    priority: 'Medium',
    input: 'GET /metrics',
    expectedResult: 'HTTP 200 text/plain with prometheus metrics format',
    actualResult: `HTTP ${sy1.status}, hasMetrics: ${hasProm}`,
    statusCode: sy1.status,
    result: sy1.status === 200 && hasProm ? 'PASS' : 'FAIL',
    duration: sy1.duration
  });

  // TC-SYST-002: System Health Status
  const sy2 = await apiRequest('GET', '/api/admin/system/health', null, adminHeaders);
  recordTest({
    testId: 'TC-SYST-002',
    reqId: 'REQ-STOR-01',
    module: 'System',
    feature: 'System Health Diagnostic',
    testType: 'Observability',
    priority: 'Medium',
    input: 'GET /api/admin/system/health',
    expectedResult: 'HTTP 200 with database and api health status',
    actualResult: `HTTP ${sy2.status}, api status: ${sy2.body?.systemHealth?.health?.api?.status}`,
    statusCode: sy2.status,
    result: sy2.status === 200 ? 'PASS' : 'FAIL',
    duration: sy2.duration
  });
}
