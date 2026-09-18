import { apiRequest, recordTest } from './test_helper.mjs';

export async function runSecuritySuite(tokens) {
  console.log('\n==================================================');
  console.log('--- 3. RUNNING COMPREHENSIVE SECURITY AUDIT SUITE ---');
  console.log('==================================================\n');

  const { studentToken, facultyToken } = tokens;
  const studentHeaders = { Authorization: `Bearer ${studentToken}` };

  // ─── 1. BOLA / IDOR on Exam Recovery ───────────────────────────────────────
  // TC-SECU-BOLA-01: Unauthenticated Exam Recovery Save
  const sec1 = await apiRequest('POST', '/api/exam-recovery/save', {
    testId: 'test_sec_audit',
    studentId: 'victim_student_123',
    answers: { q1: 'A', q2: 'B' }
  }); // NO auth headers!
  // In examRecovery.js, there is NO requireAuth!
  const isProtected1 = sec1.status === 401 || sec1.status === 403;
  recordTest({
    testId: 'TC-SECU-BOLA-01',
    reqId: 'REQ-RECO-01',
    module: 'Exam Recovery',
    feature: 'Exam Snapshot Save Authorization',
    testType: 'Security / BOLA',
    priority: 'Critical',
    severity: 'Critical',
    input: { testId: 'test_sec_audit', studentId: 'victim_student_123' },
    expectedResult: 'HTTP 401 Unauthorized (unauthenticated users must not save exam snapshots)',
    actualResult: `HTTP ${sec1.status}: ${JSON.stringify(sec1.body)}`,
    statusCode: sec1.status,
    result: isProtected1 ? 'PASS' : 'FAIL',
    duration: sec1.duration,
    errorMessage: isProtected1 ? null : 'CRITICAL VULNERABILITY (BOLA/IDOR): /api/exam-recovery/save allows unauthenticated users to overwrite any student exam answers!',
    bugId: isProtected1 ? null : 'BUG-SEC-001',
    rootCause: isProtected1 ? null : 'examRecovery.js: router.post("/api/exam-recovery/save") lacks requireAuth() and student ownership verification',
    recommendedFix: isProtected1 ? null : 'Add requireAuth(req, res, "student") and verify req.user.id matches req.body.studentId'
  });

  // TC-SECU-BOLA-02: Unauthenticated Exam Recovery Restore
  const sec2 = await apiRequest('GET', '/api/exam-recovery/restore?testId=test_sec_audit&studentId=victim_student_123');
  const isProtected2 = sec2.status === 401 || sec2.status === 403;
  recordTest({
    testId: 'TC-SECU-BOLA-02',
    reqId: 'REQ-RECO-01',
    module: 'Exam Recovery',
    feature: 'Exam Snapshot Restore Authorization',
    testType: 'Security / BOLA',
    priority: 'Critical',
    severity: 'Critical',
    input: 'GET /api/exam-recovery/restore without token',
    expectedResult: 'HTTP 401 Unauthorized (unauthenticated users must not read student exam snapshots)',
    actualResult: `HTTP ${sec2.status}: snapshot leaked = ${!!sec2.body?.snapshot}`,
    statusCode: sec2.status,
    result: isProtected2 ? 'PASS' : 'FAIL',
    duration: sec2.duration,
    errorMessage: isProtected2 ? null : 'CRITICAL VULNERABILITY (IDOR): /api/exam-recovery/restore allows unauthenticated users to inspect any student exam answers!',
    bugId: isProtected2 ? null : 'BUG-SEC-002',
    rootCause: isProtected2 ? null : 'examRecovery.js: router.get("/api/exam-recovery/restore") lacks requireAuth() and student ownership verification',
    recommendedFix: isProtected2 ? null : 'Add requireAuth(req, res, "student") and verify req.user.id matches req.query.studentId'
  });

  // ─── 2. BFLA (Broken Function Level Authorization) on Test Questions ───────
  // TC-SECU-BFLA-01: Unauthenticated MCQ Question Leak
  const sec3 = await apiRequest('GET', '/api/tests/test_1/questions/mcq'); // NO auth
  const leaksAnswers = sec3.status === 200 && Array.isArray(sec3.body) && sec3.body.some(q => q.correctAnswers !== undefined);
  const isProtected3 = sec3.status === 401 || sec3.status === 403 || !leaksAnswers;
  recordTest({
    testId: 'TC-SECU-BFLA-01',
    reqId: 'REQ-TEST-02',
    module: 'Tests',
    feature: 'MCQ Full Questions Leak Protection',
    testType: 'Security / BFLA',
    priority: 'Critical',
    severity: 'Critical',
    input: 'GET /api/tests/test_1/questions/mcq without authentication',
    expectedResult: 'HTTP 401/403 Forbidden or correct answers omitted',
    actualResult: `HTTP ${sec3.status}, correctAnswers leaked: ${leaksAnswers}`,
    statusCode: sec3.status,
    result: isProtected3 ? 'PASS' : 'FAIL',
    duration: sec3.duration,
    errorMessage: isProtected3 ? null : 'CRITICAL VULNERABILITY (BFLA/Data Leak): /api/tests/:id/questions/mcq has no auth and returns correctAnswers to anyone!',
    bugId: isProtected3 ? null : 'BUG-SEC-003',
    rootCause: isProtected3 ? null : 'tests.js: router.get("/api/tests/:testId/questions/mcq") does not require faculty authentication or role guard',
    recommendedFix: isProtected3 ? null : 'Enforce requireAnyRole(req, res, "faculty", "admin") on full questions endpoints'
  });

  // TC-SECU-BFLA-02: Unauthenticated Question Tampering (Create Question)
  const sec4 = await apiRequest('POST', '/api/tests/test_1/questions/mcq', {
    questionText: 'Hacked question injected by malicious actor',
    options: ['A', 'B'],
    correctAnswers: [0],
    marks: 100
  }); // NO auth headers!
  const isProtected4 = sec4.status === 401 || sec4.status === 403;
  recordTest({
    testId: 'TC-SECU-BFLA-02',
    reqId: 'REQ-TEST-01',
    module: 'Tests',
    feature: 'Question Creation Authorization Guard',
    testType: 'Security / BFLA',
    priority: 'Critical',
    severity: 'Critical',
    input: 'POST /api/tests/test_1/questions/mcq without authentication',
    expectedResult: 'HTTP 401/403 Forbidden (Only faculty/admin may add questions)',
    actualResult: `HTTP ${sec4.status}, question created: ${sec4.status === 201}`,
    statusCode: sec4.status,
    result: isProtected4 ? 'PASS' : 'FAIL',
    duration: sec4.duration,
    errorMessage: isProtected4 ? null : 'CRITICAL VULNERABILITY (BFLA): Anonymous users can inject arbitrary test questions into live tests!',
    bugId: isProtected4 ? null : 'BUG-SEC-004',
    rootCause: isProtected4 ? null : 'tests.js: router.post("/api/tests/:testId/questions/mcq") lacks requireAnyRole("faculty", "admin")',
    recommendedFix: isProtected4 ? null : 'Enforce requireAnyRole(req, res, "faculty", "admin") on all question CRUD endpoints'
  });

  // TC-SECU-BFLA-03: Unauthenticated Question Tampering (Delete Question)
  const sec5 = await apiRequest('DELETE', '/api/questions/mcq/non_existent_or_sample'); // NO auth
  const isProtected5 = sec5.status === 401 || sec5.status === 403;
  recordTest({
    testId: 'TC-SECU-BFLA-03',
    reqId: 'REQ-TEST-01',
    module: 'Tests',
    feature: 'Question Deletion Authorization Guard',
    testType: 'Security / BFLA',
    priority: 'Critical',
    severity: 'Critical',
    input: 'DELETE /api/questions/mcq/:id without authentication',
    expectedResult: 'HTTP 401/403 Forbidden',
    actualResult: `HTTP ${sec5.status}`,
    statusCode: sec5.status,
    result: isProtected5 ? 'PASS' : 'FAIL',
    duration: sec5.duration,
    errorMessage: isProtected5 ? null : 'CRITICAL VULNERABILITY (BFLA): Anonymous users can delete test questions without authorization!',
    bugId: isProtected5 ? null : 'BUG-SEC-005',
    rootCause: isProtected5 ? null : 'tests.js: router.delete("/api/questions/mcq/:id") lacks requireAnyRole("faculty", "admin")',
    recommendedFix: isProtected5 ? null : 'Enforce requireAnyRole(req, res, "faculty", "admin") on DELETE question routes'
  });

  // TC-SECU-BFLA-04: Unauthenticated Assignment Grading
  const sec6 = await apiRequest('POST', '/api/assignments/submission/sample_sub/grade', {
    marks: 100,
    feedback: 'Tampered grade by student'
  }); // NO auth headers!
  const isProtected6 = sec6.status === 401 || sec6.status === 403;
  recordTest({
    testId: 'TC-SECU-BFLA-04',
    reqId: 'REQ-ASGN-01',
    module: 'Assignments',
    feature: 'Assignment Grading Authorization Guard',
    testType: 'Security / BFLA',
    priority: 'High',
    severity: 'High',
    input: 'POST /api/assignments/submission/:id/grade without authentication',
    expectedResult: 'HTTP 401/403 Forbidden',
    actualResult: `HTTP ${sec6.status}`,
    statusCode: sec6.status,
    result: isProtected6 ? 'PASS' : 'FAIL',
    duration: sec6.duration,
    errorMessage: isProtected6 ? null : 'HIGH VULNERABILITY: /api/assignments/submission/:submissionId/grade has no auth check, allowing anyone to grade submissions',
    bugId: isProtected6 ? null : 'BUG-SEC-006',
    rootCause: isProtected6 ? null : 'assignments.js: grade endpoint does not verify faculty role',
    recommendedFix: isProtected6 ? null : 'Add requireAnyRole(req, res, "faculty", "admin") to assignment grade endpoint'
  });

  // ─── 3. Path Traversal Testing ─────────────────────────────────────────────
  // TC-SECU-TRAV-01: Static /uploads/ Directory Path Traversal
  const sec7 = await apiRequest('GET', '/uploads/..%2F..%2Fpackage.json');
  const isBlocked7 = sec7.status === 403 || sec7.status === 404;
  recordTest({
    testId: 'TC-SECU-TRAV-01',
    reqId: 'REQ-CONT-01',
    module: 'Content',
    feature: 'Uploads Path Traversal Guard',
    testType: 'Security / Path Traversal',
    priority: 'Critical',
    severity: 'Critical',
    input: 'GET /uploads/..%2F..%2Fpackage.json',
    expectedResult: 'HTTP 403 Forbidden or 404 Not Found (path traversal prevented)',
    actualResult: `HTTP ${sec7.status}`,
    statusCode: sec7.status,
    result: isBlocked7 ? 'PASS' : 'FAIL',
    duration: sec7.duration,
    errorMessage: isBlocked7 ? null : 'Path traversal succeeded in reading host files!'
  });

  // ─── 4. Safe Injection Testing ─────────────────────────────────────────────
  // TC-SECU-INJ-01: NoSQL / JSON Injection in Search Filters
  const sec8 = await apiRequest('GET', "/api/problems?difficulty='%20OR%20'1'='1");
  const isSafe8 = sec8.status === 200 && Array.isArray(sec8.body?.problems) && sec8.body.problems.length === 0;
  recordTest({
    testId: 'TC-SECU-INJ-01',
    reqId: 'REQ-PROB-01',
    module: 'Problems',
    feature: 'SQL/NoSQL Injection in Query Parameters',
    testType: 'Security / Injection',
    priority: 'High',
    severity: 'High',
    input: "GET /api/problems?difficulty=' OR '1'='1",
    expectedResult: 'HTTP 200 with 0 matches (literal string match, no query hijacking)',
    actualResult: `HTTP ${sec8.status}, returned items: ${sec8.body?.problems?.length}`,
    statusCode: sec8.status,
    result: isSafe8 ? 'PASS' : 'FAIL',
    duration: sec8.duration,
    errorMessage: isSafe8 ? null : 'Query parameter allowed injection of all records!'
  });

  // ─── 5. Security Headers Verification ──────────────────────────────────────
  // TC-SECU-HDR-01: Online Examination Security Headers Check
  const sec9 = await apiRequest('GET', '/api');
  const headers = sec9.headers;
  const xFrame = headers['x-frame-options'];
  const xContent = headers['x-content-type-options'];
  const permPolicy = headers['permissions-policy'];
  const hasHeaders = xFrame === 'DENY' && xContent === 'nosniff' && !!permPolicy;
  recordTest({
    testId: 'TC-SECU-HDR-01',
    reqId: 'REQ-SECR-01',
    module: 'Security',
    feature: 'Online Examination Security Headers',
    testType: 'Security / Hardening',
    priority: 'High',
    severity: 'Medium',
    input: 'GET /api',
    expectedResult: 'X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Permissions-Policy present',
    actualResult: `X-Frame-Options: ${xFrame}, X-Content-Type-Options: ${xContent}, Permissions-Policy: ${permPolicy}`,
    statusCode: sec9.status,
    result: hasHeaders ? 'PASS' : 'FAIL',
    duration: sec9.duration,
    errorMessage: hasHeaders ? null : 'Missing required security hardening headers'
  });
}
