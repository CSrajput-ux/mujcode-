import { apiRequest, recordTest } from './test_helper.mjs';

export async function runAiProctoringSuite(tokens) {
  console.log('\n==================================================');
  console.log('--- 5. RUNNING AI PROCTORING & EXAM SECURITY SUITE ---');
  console.log('==================================================\n');

  const { studentToken, facultyToken } = tokens;
  const studentHeaders = { Authorization: `Bearer ${studentToken}` };
  const facultyHeaders = { Authorization: `Bearer ${facultyToken}` };

  const testId = 'test_ai_proctor_eval';
  const studentId = 'stu_mrj6pzoe_ln2wlm';

  // TC-AI-001: Log Multiple Faces AI Violation Event
  const pr1 = await apiRequest('POST', '/api/exam-security/log-violation', {
    testId,
    studentId,
    studentName: 'Souritra Mukherjee',
    type: 'MULTIPLE_FACES',
    message: 'AI TinyFaceDetector detected 2 faces in camera frame',
    snapshot: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...'
  }, studentHeaders);
  const p1 = pr1.status === 200 && pr1.body?.success && pr1.body?.totalCheatingScore >= 5;
  recordTest({
    testId: 'TC-AI-001',
    reqId: 'REQ-SECU-01',
    module: 'Exam Security',
    feature: 'AI Face Detection Violation Ingestion',
    testType: 'ML/AI / Functional',
    priority: 'Critical',
    input: { type: 'MULTIPLE_FACES', detector: 'TinyFaceDetector' },
    expectedResult: 'HTTP 200, session updated with cheating score increment',
    actualResult: `HTTP ${pr1.status}, totalCheatingScore: ${pr1.body?.totalCheatingScore}`,
    statusCode: pr1.status,
    result: p1 ? 'PASS' : 'FAIL',
    duration: pr1.duration
  });

  // TC-AI-002: Log Forbidden Object (COCO-SSD MobileNetV2) Violation Event
  const pr2 = await apiRequest('POST', '/api/exam-security/log-violation', {
    testId,
    studentId,
    studentName: 'Souritra Mukherjee',
    type: 'FORBIDDEN_OBJECT',
    message: 'COCO-SSD detected prohibited object: cell phone (confidence: 94.2%)'
  }, studentHeaders);
  const p2 = pr2.status === 200 && pr2.body?.success;
  recordTest({
    testId: 'TC-AI-002',
    reqId: 'REQ-SECU-01',
    module: 'Exam Security',
    feature: 'AI Object Detection (COCO-SSD) Violation Ingestion',
    testType: 'ML/AI / Functional',
    priority: 'Critical',
    input: { type: 'FORBIDDEN_OBJECT', object: 'cell phone', confidence: 0.942 },
    expectedResult: 'HTTP 200, forbidden object recorded in timeline',
    actualResult: `HTTP ${pr2.status}`,
    statusCode: pr2.status,
    result: p2 ? 'PASS' : 'FAIL',
    duration: pr2.duration
  });

  // TC-AI-003: Log DevTools Opening Violation Event (Weight: 20 points)
  const pr3 = await apiRequest('POST', '/api/exam-security/log-violation', {
    testId,
    studentId,
    studentName: 'Souritra Mukherjee',
    type: 'DEVTOOLS_OPENED',
    message: 'Developer tools inspection console opened'
  }, studentHeaders);
  const p3 = pr3.status === 200 && pr3.body?.success && pr3.body?.totalCheatingScore >= 25;
  recordTest({
    testId: 'TC-AI-003',
    reqId: 'REQ-SECU-01',
    module: 'Exam Security',
    feature: 'DevTools Detection & Severity Weighting',
    testType: 'Security / Functional',
    priority: 'High',
    input: { type: 'DEVTOOLS_OPENED', weight: 20 },
    expectedResult: 'HTTP 200, totalCheatingScore incremented by 20 points',
    actualResult: `HTTP ${pr3.status}, totalCheatingScore: ${pr3.body?.totalCheatingScore}`,
    statusCode: pr3.status,
    result: p3 ? 'PASS' : 'FAIL',
    duration: pr3.duration
  });

  // TC-AI-004: Faculty Queries Real-time Proctoring Sessions
  const pr4 = await apiRequest('GET', `/api/exam-security/test-sessions?testId=${testId}`, null, facultyHeaders);
  const sessionFound = pr4.body?.sessions?.some(s => s.testId === testId && s.studentId === studentId);
  const p4 = pr4.status === 200 && sessionFound;
  recordTest({
    testId: 'TC-AI-004',
    reqId: 'REQ-SECU-01',
    module: 'Exam Security',
    feature: 'Live Proctor Dashboard Session Feed',
    testType: 'Integration / Real-Time',
    priority: 'High',
    input: `GET /api/exam-security/test-sessions?testId=${testId}`,
    expectedResult: 'HTTP 200, faculty receives aggregated student sessions & scores',
    actualResult: `HTTP ${pr4.status}, sessionFound: ${sessionFound}`,
    statusCode: pr4.status,
    result: p4 ? 'PASS' : 'FAIL',
    duration: pr4.duration
  });

  // TC-AI-005: Student Timeline Incident History
  const pr5 = await apiRequest('GET', `/api/exam-security/student-timeline?testId=${testId}&studentId=${studentId}`, null, facultyHeaders);
  const logsCount = pr5.body?.logs?.length || 0;
  const p5 = pr5.status === 200 && logsCount >= 3;
  recordTest({
    testId: 'TC-AI-005',
    reqId: 'REQ-SECU-01',
    module: 'Exam Security',
    feature: 'Student Security Violation Timeline Audit',
    testType: 'Audit / Forensics',
    priority: 'High',
    input: `GET /api/exam-security/student-timeline`,
    expectedResult: 'HTTP 200 with complete audit trail of timestamps and violation types',
    actualResult: `HTTP ${pr5.status}, incidentCount: ${logsCount}`,
    statusCode: pr5.status,
    result: p5 ? 'PASS' : 'FAIL',
    duration: pr5.duration
  });
}
