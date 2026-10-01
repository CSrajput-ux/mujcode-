import { httpRequest } from '../lib/client.js';
import { MetricsCollector } from '../lib/metrics.js';
import { signToken } from '../lib/generator.js';

export async function runSearchPaginationTest(baseUrl = 'http://127.0.0.1:5000') {
  console.log(`\n===============================================================`);
  console.log(`[TEST 19] SEARCH & PAGINATION UNDER HIGH CONCURRENCY`);
  console.log(`===============================================================`);

  const studentToken = signToken({ id: 'search_tester', email: 'search@muj.edu', role: 'student' });
  const authHeaders = {
    'Authorization': `Bearer ${studentToken}`
  };

  const queries = [
    { name: 'Common Search (Array)', path: '/api/problems?search=Array&limit=20&page=1' },
    { name: 'Rare Search (Floyd)', path: '/api/problems?search=Floyd&limit=20&page=1' },
    { name: 'Non-existent Search (XYZQ123)', path: '/api/problems?search=XYZQ123&limit=20&page=1' },
    { name: 'Empty Search (All)', path: '/api/problems?limit=50&page=1' },
    { name: 'Deep Pagination (Page 5)', path: '/api/problems?limit=20&page=5' },
    { name: 'Deep Pagination (Page 15)', path: '/api/problems?limit=20&page=15' },
    { name: 'Filtered by Difficulty (Hard)', path: '/api/problems?difficulty=Hard&limit=20&page=1' },
    { name: 'Combined Filter (Dynamic Programming + Medium)', path: '/api/problems?search=Dynamic&difficulty=Medium&limit=20&page=1' }
  ];

  const results = [];

  for (const q of queries) {
    const collector = new MetricsCollector(q.name);
    collector.start();

    // 50 concurrent requests for each search type
    const promises = Array.from({ length: 50 }, (_, i) =>
      httpRequest({
        baseUrl,
        path: q.path,
        headers: { ...authHeaders, 'X-Forwarded-For': `10.45.1.${i + 1}` }
      }).then(res => collector.record(res.latencyMs, res.statusCode, res.error))
    );

    await Promise.all(promises);
    collector.stop();

    const summary = collector.getSummary();
    results.push({
      queryName: q.name,
      path: q.path,
      p50: summary.p50,
      p95: summary.p95,
      p99: summary.p99,
      avg: summary.avg,
      rps: summary.rps,
      errorRatePct: summary.errorRatePct
    });

    console.log(`[SEARCH] ${q.name.padEnd(45)} | p50: ${String(summary.p50).padStart(5)}ms | p95: ${String(summary.p95).padStart(5)}ms | RPS: ${summary.rps}`);
  }

  return results;
}
