import assert from 'node:assert';
import crypto from 'node:crypto';
import { apiRequest, recordTest } from './test_helper.mjs';
import { config } from '../src/config.js';

export async function runAuthSuite() {
  console.log('\n==================================================');
  console.log('--- 1. RUNNING AUTHENTICATION & AUTHORIZATION SUITE ---');
  console.log('==================================================\n');

  let adminToken = '';
  let facultyToken = '';
  let studentToken = '';

  // TC-AUTH-001: Positive Login Admin
  const t1Start = Date.now();
  const res1 = await apiRequest('POST', '/api/auth/login', {
    email: 'admin@jaipur.manipal.edu',
    password: 'Admin@123',
    role: 'admin'
  });
  const t1End = Date.now();
  const p1 = res1.status === 200 && res1.body?.success && res1.body?.token && !res1.body?.user?.password;
  if (p1) adminToken = res1.body.token;
  recordTest({
    testId: 'TC-AUTH-001',
    reqId: 'REQ-AUTH-01',
    module: 'Auth',
    feature: 'Admin Login',
    testType: 'Positive',
    priority: 'Critical',
    severity: 'Critical',
    input: { email: 'admin@jaipur.manipal.edu', password: '***', role: 'admin' },
    expectedResult: 'HTTP 200, valid token, user object returned without password hash',
    actualResult: `HTTP ${res1.status}, token present: ${!!res1.body?.token}`,
    statusCode: res1.status,
    result: p1 ? 'PASS' : 'FAIL',
    duration: t1End - t1Start,
    errorMessage: p1 ? null : JSON.stringify(res1.body || res1.rawText)
  });

  // TC-AUTH-002: Positive Login Faculty
  const t2Start = Date.now();
  const res2 = await apiRequest('POST', '/api/auth/login', {
    email: 'madhura.yadav@jaipur.manipal.edu',
    password: 'faculty@123',
    role: 'faculty'
  });
  const t2End = Date.now();
  const p2 = res2.status === 200 && res2.body?.success && res2.body?.token;
  if (p2) facultyToken = res2.body.token;
  recordTest({
    testId: 'TC-AUTH-002',
    reqId: 'REQ-AUTH-01',
    module: 'Auth',
    feature: 'Faculty Login',
    testType: 'Positive',
    priority: 'Critical',
    severity: 'Critical',
    input: { email: 'madhura.yadav@jaipur.manipal.edu', password: '***', role: 'faculty' },
    expectedResult: 'HTTP 200, valid faculty token and profile',
    actualResult: `HTTP ${res2.status}`,
    statusCode: res2.status,
    result: p2 ? 'PASS' : 'FAIL',
    duration: t2End - t2Start,
    errorMessage: p2 ? null : JSON.stringify(res2.body || res2.rawText)
  });

  // TC-AUTH-003: Positive Login Student with Email
  const t3Start = Date.now();
  const res3 = await apiRequest('POST', '/api/auth/login', {
    email: 'souritra.2427030587@muj.manipal.edu',
    password: '2427030587',
    role: 'student'
  });
  const t3End = Date.now();
  const p3 = res3.status === 200 && res3.body?.success && res3.body?.token;
  if (p3) studentToken = res3.body.token;
  recordTest({
    testId: 'TC-AUTH-003',
    reqId: 'REQ-AUTH-01',
    module: 'Auth',
    feature: 'Student Login via Email',
    testType: 'Positive',
    priority: 'Critical',
    severity: 'Critical',
    input: { email: 'souritra.2427030587@muj.manipal.edu', password: '***', role: 'student' },
    expectedResult: 'HTTP 200, valid student token and profile',
    actualResult: `HTTP ${res3.status}`,
    statusCode: res3.status,
    result: p3 ? 'PASS' : 'FAIL',
    duration: t3End - t3Start,
    errorMessage: p3 ? null : JSON.stringify(res3.body || res3.rawText)
  });

  // TC-AUTH-004: Student Login with College ID (As configured in UI LoginPage.tsx)
  const t4Start = Date.now();
  const res4 = await apiRequest('POST', '/api/auth/login', {
    email: '2427030587', // UI sends college ID in the email field
    password: '2427030587',
    role: 'student'
  });
  const t4End = Date.now();
  // We test the ACTUAL behavior. In LoginPage.tsx, student enters collegeId and it is sent as email.
  // In UserRepository.js, findByEmailAndRole only checks u.email === email.
  const p4 = res4.status === 200;
  recordTest({
    testId: 'TC-AUTH-004',
    reqId: 'REQ-AUTH-03',
    module: 'Auth',
    feature: 'Student Login via College ID',
    testType: 'Integration / Usability',
    priority: 'High',
    severity: 'High',
    input: { email: '2427030587', password: '***', role: 'student' },
    expectedResult: 'HTTP 200 (Student should be able to authenticate with College ID as prompted by UI)',
    actualResult: `HTTP ${res4.status}: ${res4.body?.error || res4.rawText}`,
    statusCode: res4.status,
    result: p4 ? 'PASS' : 'FAIL',
    duration: t4End - t4Start,
    errorMessage: p4 ? null : `Backend UserRepository.js only searches u.email and ignores u.college_id, rejecting valid student college ID input: ${res4.body?.error}`,
    bugId: p4 ? null : 'BUG-AUTH-001',
    rootCause: p4 ? null : 'UserRepository.js: findByEmailAndRole does not check u.college_id',
    recommendedFix: p4 ? null : 'Update UserRepository.findByEmailAndRole to match (u.email === id || u.college_id === id)'
  });

  // TC-AUTH-005: Negative Login - Wrong Password
  const t5Start = Date.now();
  const res5 = await apiRequest('POST', '/api/auth/login', {
    email: 'admin@jaipur.manipal.edu',
    password: 'WrongPassword!999',
    role: 'admin'
  });
  const t5End = Date.now();
  const p5 = res5.status === 401;
  recordTest({
    testId: 'TC-AUTH-005',
    reqId: 'REQ-AUTH-02',
    module: 'Auth',
    feature: 'Login Invalid Password',
    testType: 'Negative',
    priority: 'Critical',
    severity: 'High',
    input: { email: 'admin@jaipur.manipal.edu', password: 'WrongPassword!999', role: 'admin' },
    expectedResult: 'HTTP 401 Unauthorized',
    actualResult: `HTTP ${res5.status}`,
    statusCode: res5.status,
    result: p5 ? 'PASS' : 'FAIL',
    duration: t5End - t5Start,
    errorMessage: p5 ? null : `Expected 401 but got ${res5.status}`
  });

  // TC-AUTH-006: Negative Login - Non-existent User
  const t6Start = Date.now();
  const res6 = await apiRequest('POST', '/api/auth/login', {
    email: 'does_not_exist_999@muj.manipal.edu',
    password: 'password123',
    role: 'student'
  });
  const t6End = Date.now();
  const p6 = res6.status === 401;
  recordTest({
    testId: 'TC-AUTH-006',
    reqId: 'REQ-AUTH-02',
    module: 'Auth',
    feature: 'Login Non-Existent User',
    testType: 'Negative',
    priority: 'High',
    severity: 'Medium',
    input: { email: 'does_not_exist_999@muj.manipal.edu', password: '***', role: 'student' },
    expectedResult: 'HTTP 401 Unauthorized',
    actualResult: `HTTP ${res6.status}`,
    statusCode: res6.status,
    result: p6 ? 'PASS' : 'FAIL',
    duration: t6End - t6Start,
    errorMessage: p6 ? null : `Expected 401 but got ${res6.status}`
  });

  // TC-AUTH-007: Negative Login - Role Mismatch
  const t7Start = Date.now();
  const res7 = await apiRequest('POST', '/api/auth/login', {
    email: 'admin@jaipur.manipal.edu',
    password: 'Admin@123',
    role: 'student' // Admin user trying to log in as student
  });
  const t7End = Date.now();
  const p7 = res7.status === 401;
  recordTest({
    testId: 'TC-AUTH-007',
    reqId: 'REQ-AUTH-02',
    module: 'Auth',
    feature: 'Login Role Mismatch',
    testType: 'Negative / Security',
    priority: 'High',
    severity: 'High',
    input: { email: 'admin@jaipur.manipal.edu', role: 'student' },
    expectedResult: 'HTTP 401 Unauthorized (role mismatch prevents cross-role assumption)',
    actualResult: `HTTP ${res7.status}`,
    statusCode: res7.status,
    result: p7 ? 'PASS' : 'FAIL',
    duration: t7End - t7Start,
    errorMessage: p7 ? null : `Expected 401 but got ${res7.status}`
  });

  // TC-AUTH-008: Missing Fields in Login
  const t8Start = Date.now();
  const res8 = await apiRequest('POST', '/api/auth/login', {
    email: 'admin@jaipur.manipal.edu'
    // missing password and role
  });
  const t8End = Date.now();
  const p8 = res8.status === 400;
  recordTest({
    testId: 'TC-AUTH-008',
    reqId: 'REQ-AUTH-02',
    module: 'Auth',
    feature: 'Login Missing Fields Validation',
    testType: 'Validation',
    priority: 'High',
    severity: 'Medium',
    input: { email: 'admin@jaipur.manipal.edu' },
    expectedResult: 'HTTP 400 Bad Request with missing fields message',
    actualResult: `HTTP ${res8.status}: ${res8.body?.error}`,
    statusCode: res8.status,
    result: p8 ? 'PASS' : 'FAIL',
    duration: t8End - t8Start,
    errorMessage: p8 ? null : `Expected 400 but got ${res8.status}`
  });

  // TC-AUTH-009: Token Verification - Tampered Signature
  const t9Start = Date.now();
  const fakeToken = `${adminToken.split('.')[0]}.invalid_signature_hex`;
  const res9 = await apiRequest('GET', '/api/admin/dashboard/stats', null, {
    Authorization: `Bearer ${fakeToken}`
  });
  const t9End = Date.now();
  const p9 = res9.status === 401;
  recordTest({
    testId: 'TC-AUTH-009',
    reqId: 'REQ-AUTH-05',
    module: 'Auth',
    feature: 'Token Signature Tampering Guard',
    testType: 'Security',
    priority: 'Critical',
    severity: 'Critical',
    input: { Authorization: `Bearer ${fakeToken}` },
    expectedResult: 'HTTP 401 Unauthorized (tampered signature rejected)',
    actualResult: `HTTP ${res9.status}`,
    statusCode: res9.status,
    result: p9 ? 'PASS' : 'FAIL',
    duration: t9End - t9Start,
    errorMessage: p9 ? null : `Expected 401 on tampered token but got ${res9.status}`
  });

  // TC-AUTH-010: Token Verification - Expired Token
  const t10Start = Date.now();
  const expiredPayload = {
    id: 'adm_1',
    email: 'admin@jaipur.manipal.edu',
    role: 'admin',
    issuedAt: Date.now() - 48 * 3600 * 1000,
    expiresAt: Date.now() - 24 * 3600 * 1000 // Expired 24h ago
  };
  const expEncoded = Buffer.from(JSON.stringify(expiredPayload)).toString('base64url');
  const expSig = crypto.createHmac('sha256', config.tokenSecret).update(expEncoded).digest('base64url');
  const expiredToken = `${expEncoded}.${expSig}`;

  const res10 = await apiRequest('GET', '/api/admin/dashboard/stats', null, {
    Authorization: `Bearer ${expiredToken}`
  });
  const t10End = Date.now();
  const p10 = res10.status === 401;
  recordTest({
    testId: 'TC-AUTH-010',
    reqId: 'REQ-AUTH-05',
    module: 'Auth',
    feature: 'Expired Token Rejection',
    testType: 'Security',
    priority: 'High',
    severity: 'High',
    input: { Authorization: `Bearer ${expiredToken}` },
    expectedResult: 'HTTP 401 Unauthorized (expired token rejected)',
    actualResult: `HTTP ${res10.status}`,
    statusCode: res10.status,
    result: p10 ? 'PASS' : 'FAIL',
    duration: t10End - t10Start,
    errorMessage: p10 ? null : `Expected 401 on expired token but got ${res10.status}`
  });

  // TC-AUTH-011: Role Authorization - Student accessing Admin endpoint
  const t11Start = Date.now();
  const res11 = await apiRequest('GET', '/api/admin/dashboard/stats', null, {
    Authorization: `Bearer ${studentToken}`
  });
  const t11End = Date.now();
  const p11 = res11.status === 403;
  recordTest({
    testId: 'TC-AUTH-011',
    reqId: 'REQ-AUTH-05',
    module: 'Auth',
    feature: 'Role Access Guard (Student -> Admin route)',
    testType: 'Authorization / Security',
    priority: 'Critical',
    severity: 'Critical',
    input: { role: 'student', target: '/api/admin/dashboard/stats' },
    expectedResult: 'HTTP 403 Forbidden',
    actualResult: `HTTP ${res11.status}`,
    statusCode: res11.status,
    result: p11 ? 'PASS' : 'FAIL',
    duration: t11End - t11Start,
    errorMessage: p11 ? null : `Expected 403 on role privilege violation but got ${res11.status}`
  });

  // TC-AUTH-012: Role Authorization - Faculty accessing Admin endpoint
  const t12Start = Date.now();
  const res12 = await apiRequest('GET', '/api/admin/students', null, {
    Authorization: `Bearer ${facultyToken}`
  });
  const t12End = Date.now();
  const p12 = res12.status === 403;
  recordTest({
    testId: 'TC-AUTH-012',
    reqId: 'REQ-AUTH-05',
    module: 'Auth',
    feature: 'Role Access Guard (Faculty -> Admin route)',
    testType: 'Authorization / Security',
    priority: 'Critical',
    severity: 'Critical',
    input: { role: 'faculty', target: '/api/admin/students' },
    expectedResult: 'HTTP 403 Forbidden',
    actualResult: `HTTP ${res12.status}`,
    statusCode: res12.status,
    result: p12 ? 'PASS' : 'FAIL',
    duration: t12End - t12Start,
    errorMessage: p12 ? null : `Expected 403 on role privilege violation but got ${res12.status}`
  });

  // TC-AUTH-013: Password Change - Invalid Old Password
  const t13Start = Date.now();
  const res13 = await apiRequest('POST', '/api/auth/change-password', {
    email: 'admin@jaipur.manipal.edu',
    oldPassword: 'WrongPassword999',
    newPassword: 'NewAdmin@123'
  });
  const t13End = Date.now();
  const p13 = res13.status === 401;
  recordTest({
    testId: 'TC-AUTH-013',
    reqId: 'REQ-AUTH-04',
    module: 'Auth',
    feature: 'Password Change Wrong Old Password',
    testType: 'Negative / Validation',
    priority: 'High',
    severity: 'High',
    input: { email: 'admin@jaipur.manipal.edu', oldPassword: 'WrongPassword999' },
    expectedResult: 'HTTP 401 Current password incorrect',
    actualResult: `HTTP ${res13.status}`,
    statusCode: res13.status,
    result: p13 ? 'PASS' : 'FAIL',
    duration: t13End - t13Start,
    errorMessage: p13 ? null : `Expected 401 but got ${res13.status}`
  });

  return { adminToken, facultyToken, studentToken };
}
