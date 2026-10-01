import { httpRequest } from './lib/client.js';
import { signToken } from './lib/generator.js';
import { getPostgresPool, closePostgres } from '../backend/src/lib/postgres.js';

async function testDuplicateApplications() {
  const testStudentId = `stu_atomic_test_${Date.now()}`;
  const testJobId = 8888;
  const token = signToken({ id: testStudentId, email: `${testStudentId}@muj.edu`, role: 'student' });
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'X-Forwarded-For': '10.200.1.1'
  };

  console.log(`[Duplicate Test] Firing 50 concurrent application requests for same student (${testStudentId}) and job (${testJobId})...`);

  const promises = Array.from({ length: 50 }, () =>
    httpRequest({
      baseUrl: 'http://127.0.0.1:5000',
      path: '/api/placements/apply',
      method: 'POST',
      headers: authHeaders,
      body: { jobId: testJobId }
    })
  );

  const responses = await Promise.all(promises);
  const statusCounts = {};
  responses.forEach(r => statusCounts[r.statusCode] = (statusCounts[r.statusCode] || 0) + 1);

  console.log('[Duplicate Test] Response Status Distribution:', statusCounts);

  // Now query PostgreSQL to verify exactly 1 row exists
  const p = getPostgresPool();
  const dbRes = await p.query(
    'SELECT id, job_id, student_id, status FROM applications WHERE student_id = $1 AND job_id = $2;',
    [testStudentId, testJobId]
  );
  console.log('[Duplicate Test] PostgreSQL matching rows count:', dbRes.rows.length);

  await closePostgres();

  if (statusCounts['201'] === 1 && statusCounts['409'] === 49 && dbRes.rows.length === 1) {
    console.log('✅ PASS: Exactly 1 record created (201), remaining 49 received deterministic 409 Conflict!');
    console.log('✅ PASS: Database holds exactly 1 record. Duplicate records = 0!');
    process.exit(0);
  } else {
    console.error('❌ FAIL: Duplicate applications test failed:', { statusCounts, dbRowCount: dbRes.rows.length });
    process.exit(1);
  }
}

testDuplicateApplications().catch(err => {
  console.error(err);
  process.exit(1);
});
