import { httpRequest } from '../lib/client.js';
import { MetricsCollector } from '../lib/metrics.js';
import { signToken } from '../lib/generator.js';

export async function runApiBenchmark(baseUrl = 'http://127.0.0.1:5000') {
  console.log(`\n===============================================================`);
  console.log(`[TEST 10] INDIVIDUAL API PERFORMANCE & LATENCY BENCHMARK`);
  console.log(`===============================================================`);

  const studentToken = signToken({ id: 'bench_student_1', email: 'bench@muj.edu', role: 'student' });
  const adminToken = signToken({ id: 'adm_1', email: 'admin@jaipur.manipal.edu', role: 'admin' });

  const studentHeaders = {
    'Authorization': `Bearer ${studentToken}`,
    'X-Forwarded-For': '10.99.1.1'
  };

  const adminHeaders = {
    'Authorization': `Bearer ${adminToken}`,
    'X-Forwarded-For': '10.99.1.2'
  };

  const endpoints = [
    { method: 'GET', path: '/', name: 'System Root Health', authRole: null },
    { method: 'GET', path: '/metrics', name: 'Prometheus Metrics', authRole: null },
    { method: 'GET', path: '/api/university/faculties', name: 'Faculties List', authRole: null },
    { method: 'GET', path: '/api/university/departments', name: 'Departments List', authRole: null },
    { method: 'GET', path: '/api/student/courses', name: 'Student Courses', authRole: 'student' },
    { method: 'GET', path: '/api/problems?limit=20&page=1', name: 'Problems List (Paginated)', authRole: 'student' },
    { method: 'GET', path: '/api/problems/metadata', name: 'Problems Metadata', authRole: 'student' },
    { method: 'GET', path: '/api/problems/number/901', name: 'Single Problem Details', authRole: 'student' },
    { method: 'GET', path: '/api/tests', name: 'Tests Overview', authRole: 'student' },
    { method: 'GET', path: '/api/placements/drives', name: 'Placement Drives', authRole: 'student' },
    {
      method: 'POST',
      path: '/api/exam-security/heartbeat',
      name: 'Proctoring Heartbeat',
      authRole: 'student',
      body: { sessionId: 'bench_sess_1', testId: 'test_1', faceCount: 1 }
    },
    {
      method: 'POST',
      path: '/api/exam-recovery/snapshot',
      name: 'Exam State Snapshot',
      authRole: 'student',
      body: { testId: 'test_1', answers: { q1: 'A' }, timestamp: Date.now() }
    },
    { method: 'GET', path: '/api/admin/dashboard/stats', name: 'Admin Stats Dashboard', authRole: 'admin' },
    { method: 'GET', path: '/api/admin/dashboard/students?page=1&limit=20', name: 'Admin Student Roster', authRole: 'admin' },
    { method: 'GET', path: '/api/admin/dashboard/faculty', name: 'Admin Faculty Roster', authRole: 'admin' }
  ];

  const benchmarkResults = [];

  for (const ep of endpoints) {
    const collector = new MetricsCollector(ep.name);
    collector.start();

    // 100 requests per endpoint with concurrency of 20
    const concurrency = 20;
    const totalRequests = 100;
    let completed = 0;

    const workers = Array.from({ length: concurrency }, async (_, workerId) => {
      while (completed < totalRequests) {
        completed++;
        const currentReq = completed;
        const uId = `bench_u_${workerId}_${currentReq}`;
        const headers = { 'X-Forwarded-For': `10.99.${workerId}.${currentReq % 250}` };
        if (ep.authRole) {
          const token = signToken({ id: uId, email: `${uId}@muj.edu`, role: ep.authRole });
          headers['Authorization'] = `Bearer ${token}`;
        }
        const body = ep.body ? { ...ep.body, studentId: uId } : undefined;
        const res = await httpRequest({
          baseUrl,
          path: ep.path,
          method: ep.method,
          headers,
          body
        });
        collector.record(res.latencyMs, res.statusCode, res.error);
      }
    });

    await Promise.all(workers);
    collector.stop();

    const summary = collector.getSummary();

    // Define SLA thresholds:
    // Excellent: p95 < 20ms and errorPct === 0
    // Acceptable: p95 < 200ms and errorPct <= 1%
    // Needs optimization: p95 < 500ms and errorPct <= 5%
    // Critical: p95 >= 500ms or errorPct > 5%
    let classification = 'Excellent';
    if (summary.errorRatePct > 5.0 || summary.p95 >= 500) {
      classification = 'Critical';
    } else if (summary.errorRatePct > 1.0 || summary.p95 >= 200) {
      classification = 'Needs optimization';
    } else if (summary.p95 >= 20 || summary.errorRatePct > 0) {
      classification = 'Acceptable';
    }

    benchmarkResults.push({
      endpoint: ep.path,
      method: ep.method,
      name: ep.name,
      rps: summary.rps,
      min: summary.min,
      avg: summary.avg,
      p50: summary.p50,
      p90: summary.p90,
      p95: summary.p95,
      p99: summary.p99,
      max: summary.max,
      errors: summary.failedRequests,
      errorPct: summary.errorRatePct,
      classification,
      statusCodes: summary.statusCodes
    });

    console.log(`[EP] ${ep.method} ${ep.path.padEnd(35)} | p50: ${String(summary.p50).padStart(5)}ms | p95: ${String(summary.p95).padStart(5)}ms | p99: ${String(summary.p99).padStart(5)}ms | RPS: ${summary.rps} | ${classification}`);
  }

  return benchmarkResults;
}
