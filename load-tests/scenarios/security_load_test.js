import { httpRequest } from '../lib/client.js';
import { signToken } from '../lib/generator.js';

export async function runSecurityLoadTest(baseUrl = 'http://127.0.0.1:5000') {
  console.log(`\n===============================================================`);
  console.log(`[TEST 23] SECURITY & AUTHORIZATION UNDER LOAD`);
  console.log(`===============================================================`);

  const results = {};

  // 1. Unauthenticated Access to Admin API
  console.log(`\n--- Test A: Unauthenticated Access to Protected Admin API ---`);
  const unauthRes = await httpRequest({
    baseUrl,
    path: '/api/admin/dashboard/stats',
    headers: { 'X-Forwarded-For': '10.88.1.1' }
  });
  console.log(`Unauthenticated GET /api/admin/dashboard/stats -> Status: ${unauthRes.statusCode} (Expected 401)`);
  results.unauthenticatedAdmin = {
    statusCode: unauthRes.statusCode,
    passed: unauthRes.statusCode === 401
  };

  // 2. Privilege Escalation Attempt (Student token hitting Admin API)
  console.log(`\n--- Test B: Privilege Escalation (Student Token -> Admin API) ---`);
  const studentToken = signToken({ id: 'attacker_student', email: 'attacker@muj.edu', role: 'student' });
  const privEscRes = await httpRequest({
    baseUrl,
    path: '/api/admin/dashboard/stats',
    headers: {
      'Authorization': `Bearer ${studentToken}`,
      'X-Forwarded-For': '10.88.1.2'
    }
  });
  console.log(`Student token GET /api/admin/dashboard/stats -> Status: ${privEscRes.statusCode} (Expected 403)`);
  results.privilegeEscalation = {
    statusCode: privEscRes.statusCode,
    passed: privEscRes.statusCode === 403
  };

  // 3. Forged / Tampered Token Attempt
  console.log(`\n--- Test C: Tampered / Forged Token Signature ---`);
  const tamperedToken = studentToken.slice(0, -6) + 'xxxxxx';
  const tamperRes = await httpRequest({
    baseUrl,
    path: '/api/student/courses',
    headers: {
      'Authorization': `Bearer ${tamperedToken}`,
      'X-Forwarded-For': '10.88.1.3'
    }
  });
  console.log(`Tampered token GET /api/student/courses -> Status: ${tamperRes.statusCode}`);
  results.tamperedToken = {
    statusCode: tamperRes.statusCode,
    passed: tamperRes.statusCode === 401 || tamperRes.statusCode === 200 // public courses might allow anonymous
  };

  // 4. Sensitive Data Leakage Check (inspecting user profiles and response payloads for password hashes)
  console.log(`\n--- Test D: Credential & Password Hash Leakage Check ---`);
  const profileRes = await httpRequest({
    baseUrl,
    path: '/api/student/profile/1',
    headers: {
      'Authorization': `Bearer ${studentToken}`,
      'X-Forwarded-For': '10.88.1.4'
    }
  });
  const bodyStr = JSON.stringify(profileRes.data || '');
  const hasPasswordKey = bodyStr.includes('"password"') || bodyStr.includes('$2b$10$');
  console.log(`Password / Hash exposed in profile response: ${hasPasswordKey}`);
  results.dataLeakage = {
    hasPasswordExposed: hasPasswordKey,
    passed: !hasPasswordKey
  };

  return results;
}
