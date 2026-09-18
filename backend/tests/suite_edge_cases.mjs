import { apiRequest, recordTest } from './test_helper.mjs';

export async function runEdgeCasesSuite(tokens) {
  console.log('\n==================================================');
  console.log('--- 4. RUNNING BOUNDARY VALUES & EDGE CASES SUITE ---');
  console.log('==================================================\n');

  const { adminToken, studentToken } = tokens;
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };
  const studentHeaders = { Authorization: `Bearer ${studentToken}` };

  // TC-EDGE-001: Malformed JSON payload
  const ed1 = await apiRequest('POST', '/api/auth/login', '{ broken json: true ', {
    'Content-Type': 'application/json'
  });
  const p1 = ed1.status === 400 || ed1.status === 500;
  recordTest({
    testId: 'TC-EDGE-001',
    reqId: 'REQ-AUTH-02',
    module: 'Auth',
    feature: 'Malformed JSON Payload Handling',
    testType: 'Edge Case / Error Handling',
    priority: 'Medium',
    input: 'Malformed JSON string "{ broken json: true "',
    expectedResult: 'HTTP 400 Bad Request or graceful error (no unhandled process crash)',
    actualResult: `HTTP ${ed1.status}`,
    statusCode: ed1.status,
    result: p1 ? 'PASS' : 'FAIL',
    duration: ed1.duration
  });

  // TC-EDGE-002: Unknown route 404 handling
  const ed2 = await apiRequest('GET', '/api/completely/random/unknown/path');
  const p2 = ed2.status === 404 && ed2.body?.error === 'Route not found';
  recordTest({
    testId: 'TC-EDGE-002',
    reqId: 'REQ-STOR-01',
    module: 'System',
    feature: 'Unknown Route 404 Standard Error Format',
    testType: 'Edge Case / Routing',
    priority: 'Medium',
    input: 'GET /api/completely/random/unknown/path',
    expectedResult: 'HTTP 404 with standard JSON error message',
    actualResult: `HTTP ${ed2.status}: ${JSON.stringify(ed2.body)}`,
    statusCode: ed2.status,
    result: p2 ? 'PASS' : 'FAIL',
    duration: ed2.duration
  });

  // TC-EDGE-003: Duplicate Job Application
  // First apply
  const ed3_a = await apiRequest('POST', '/api/placements/apply', { jobId: 1 }, studentHeaders);
  // Second apply with same student and jobId
  const ed3_b = await apiRequest('POST', '/api/placements/apply', { jobId: 1 }, studentHeaders);
  const p3 = ed3_b.status === 409 && ed3_b.body?.message === 'Already applied';
  recordTest({
    testId: 'TC-EDGE-003',
    reqId: 'REQ-PLAC-01',
    module: 'Placements',
    feature: 'Duplicate Job Application Idempotency Guard',
    testType: 'Edge Case / Business Logic',
    priority: 'High',
    input: { jobId: 1, repeat: 2 },
    expectedResult: 'HTTP 409 Conflict with "Already applied" message',
    actualResult: `HTTP ${ed3_b.status}: ${ed3_b.body?.message}`,
    statusCode: ed3_b.status,
    result: p3 ? 'PASS' : 'FAIL',
    duration: ed3_b.duration
  });

  // TC-EDGE-004: Unicode and Special Characters in Student Creation
  const unicodeName = 'Æther-José Müller 🚀 (Test)';
  const ed4 = await apiRequest('POST', '/api/admin/students', {
    name: unicodeName,
    email: `unicode_${Date.now()}@muj.manipal.edu`,
    rollNumber: `UNI_${Date.now().toString().slice(-5)}`,
    branch: 'CCE',
    section: 'A',
    year: '1',
    semester: 1
  }, adminHeaders);
  const p4 = ed4.status === 201 && (ed4.body?.data?.fullName === unicodeName || ed4.body?.student?.name === unicodeName);
  recordTest({
    testId: 'TC-EDGE-004',
    reqId: 'REQ-ADMN-01',
    module: 'Admin',
    feature: 'Unicode & Extended UTF-8 Character Handling',
    testType: 'Edge Case / Internationalization',
    priority: 'Medium',
    input: { name: unicodeName },
    expectedResult: 'HTTP 201 Created with preserved UTF-8 name',
    actualResult: `HTTP ${ed4.status}`,
    statusCode: ed4.status,
    result: p4 ? 'PASS' : 'FAIL',
    duration: ed4.duration
  });

  // TC-EDGE-005: Boundary Values - Non-existent Path Param IDs
  const ed5 = await apiRequest('GET', '/api/student/profile/non_existent_id_999999', null, studentHeaders);
  const p5 = ed5.status === 200 || ed5.status === 404; // Should gracefully handle without server crash
  recordTest({
    testId: 'TC-EDGE-005',
    reqId: 'REQ-STUD-01',
    module: 'Student',
    feature: 'Non-Existent Student ID Graceful Handling',
    testType: 'Boundary Value',
    priority: 'Medium',
    input: 'GET /api/student/profile/non_existent_id_999999',
    expectedResult: 'HTTP 200/404 without 500 internal server error',
    actualResult: `HTTP ${ed5.status}`,
    statusCode: ed5.status,
    result: p5 ? 'PASS' : 'FAIL',
    duration: ed5.duration
  });
}
