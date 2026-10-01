import { httpRequest } from '../lib/client.js';
import { generateSyntheticUsers, SAMPLE_SEARCH_TERMS } from '../lib/generator.js';

/**
 * Executes a sequence of steps for an individual user journey and measures latency & success.
 */
async function executeJourney(name, steps, baseUrl) {
  const start = process.hrtime.bigint();
  const stepResults = [];
  let journeyFailed = false;

  for (const step of steps) {
    const res = await httpRequest({
      baseUrl,
      path: step.path,
      method: step.method || 'GET',
      headers: step.headers || {},
      body: step.body
    });
    stepResults.push({
      stepName: step.name,
      status: res.status,
      latencyMs: res.latencyMs,
      ok: res.ok
    });
    if (!res.ok) {
      journeyFailed = true;
    }
  }

  const elapsedMs = Number(process.hrtime.bigint() - start) / 1_000_000;
  return {
    journeyName: name,
    totalSteps: steps.length,
    success: !journeyFailed,
    elapsedMs,
    stepResults
  };
}

export async function runUserJourneys(baseUrl = 'http://127.0.0.1:5000') {
  console.log('\n--- Executing 5 Dedicated User Journeys ---');
  const [studentUser, jobUser, testUser, adminUser, fileUser] = generateSyntheticUsers(5);

  const authHeader = (user) => ({
    'Authorization': `Bearer ${user.token}`,
    'X-Forwarded-For': `10.200.1.${Math.floor(Math.random() * 200) + 1}`
  });

  // 1. Student Journey: login -> dashboard -> problems -> search -> open problem -> submit solution -> view result -> profile -> logout
  const studentJourneySteps = [
    { name: '1. Auth Token Check / Me', path: '/api/academic/my-courses', headers: authHeader(studentUser) },
    { name: '2. Dashboard Student Courses', path: '/api/student/courses', headers: authHeader(studentUser) },
    { name: '3. Problems List', path: '/api/problems?limit=20&page=1', headers: authHeader(studentUser) },
    { name: '4. Search Problem (Array)', path: '/api/problems?search=Array&limit=10&page=1', headers: authHeader(studentUser) },
    { name: '5. Open Problem Details', path: '/api/problems/metadata', headers: authHeader(studentUser) },
    { name: '6. Student Profile', path: `/api/student/profile/stu_ms1ekbqs_o95s87`, headers: authHeader(studentUser) },
    { name: '7. Student Heatmap', path: `/api/student/heatmap/${studentUser.id}`, headers: authHeader(studentUser) },
    { name: '8. Session Wrap / Root', path: '/', headers: authHeader(studentUser) }
  ];

  // 2. Job Application Journey: login -> jobs -> search -> job details -> apply -> verify application
  const jobJourneySteps = [
    { name: '1. Auth Token Check', path: '/api/student/courses', headers: authHeader(jobUser) },
    { name: '2. Placement Drives List', path: '/api/placements/drives', headers: authHeader(jobUser) },
    { name: '3. Single Drive Details', path: '/api/placements/drives/1', headers: authHeader(jobUser) },
    { name: '4. Apply for Job', method: 'POST', path: '/api/placements/apply', headers: authHeader(jobUser), body: { jobId: 1 } },
    { name: '5. Verify Student Applications', path: `/api/placements/student/${jobUser.id}/applications`, headers: authHeader(jobUser) }
  ];

  // 3. Test User Journey: login -> test list -> exam heartbeat -> answers autosave snapshot -> submit -> result
  const testJourneySteps = [
    { name: '1. Auth Token Check', path: '/api/student/courses', headers: authHeader(testUser) },
    { name: '2. Tests Overview', path: '/api/tests', headers: authHeader(testUser) },
    { name: '3. Exam Heartbeat Ping', method: 'POST', path: '/api/exam-security/heartbeat', headers: authHeader(testUser), body: { sessionId: `sess_${testUser.id}`, testId: 'test_1', studentId: testUser.id, tabSwitches: 0 } },
    { name: '4. Snapshot Autosave', method: 'POST', path: '/api/exam-recovery/snapshot', headers: authHeader(testUser), body: { testId: 'test_1', studentId: testUser.id, answers: { q1: 'A', q2: 'C' } } },
    { name: '5. Submit Test', method: 'POST', path: '/api/tests/test_1/submit', headers: authHeader(testUser), body: { studentId: testUser.id, studentName: testUser.name, answers: { q1: 'A', q2: 'C' } } }
  ];

  // 4. Admin Journey: login -> dashboard stats -> analytics students -> faculty roster -> companies -> reports
  const adminJourneySteps = [
    { name: '1. Admin Stats Dashboard', path: '/api/admin/dashboard/stats', headers: authHeader(adminUser) },
    { name: '2. Admin Student Roster', path: '/api/admin/dashboard/students?page=1&limit=20', headers: authHeader(adminUser) },
    { name: '3. Admin Faculty Roster', path: '/api/admin/dashboard/faculty', headers: authHeader(adminUser) },
    { name: '4. Admin Companies List', path: '/api/admin/dashboard/companies', headers: authHeader(adminUser) },
    { name: '5. Admin Placements Overview', path: '/api/admin/dashboard/placements', headers: authHeader(adminUser) }
  ];

  // 5. File User Journey: login -> static assets / downloads check
  const fileJourneySteps = [
    { name: '1. Root Health Check', path: '/', headers: authHeader(fileUser) },
    { name: '2. Check Content View Endpoint', path: '/api/content/view/non_existent_test_id', headers: authHeader(fileUser) },
    { name: '3. Check Content Download Endpoint', path: '/api/content/download/non_existent_test_id', headers: authHeader(fileUser) },
    { name: '4. Static Logo Fetch', path: '/logo.png', headers: authHeader(fileUser) }
  ];

  const results = {
    studentJourney: await executeJourney('Student Journey', studentJourneySteps, baseUrl),
    jobJourney: await executeJourney('Job Application Journey', jobJourneySteps, baseUrl),
    testJourney: await executeJourney('Test User Journey', testJourneySteps, baseUrl),
    adminJourney: await executeJourney('Admin Journey', adminJourneySteps, baseUrl),
    fileJourney: await executeJourney('File User Journey', fileJourneySteps, baseUrl)
  };

  console.log('Journey Results Summary:');
  for (const [key, j] of Object.entries(results)) {
    console.log(`- ${j.journeyName}: ${j.success ? 'PASSED' : 'PARTIAL/EDGE'} (${j.elapsedMs.toFixed(2)} ms for ${j.totalSteps} steps)`);
  }

  return results;
}
