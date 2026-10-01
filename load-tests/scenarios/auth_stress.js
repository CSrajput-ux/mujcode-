import { httpRequest } from '../lib/client.js';
import { MetricsCollector } from '../lib/metrics.js';
import { signToken } from '../lib/generator.js';

export async function runAuthStressTest(baseUrl = 'http://127.0.0.1:5000') {
  console.log(`\n===============================================================`);
  console.log(`[TEST 16] AUTHENTICATION LOAD & STRESS TEST`);
  console.log(`===============================================================`);

  const results = {};

  // 1. Single baseline login
  console.log(`\n--- Stage 1: Single Baseline Login ---`);
  const baseRes = await httpRequest({
    baseUrl,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'X-Forwarded-For': '10.0.0.1' },
    body: {
      email: 'admin@jaipur.manipal.edu',
      password: 'Admin@123',
      role: 'admin'
    }
  });
  console.log(`Status: ${baseRes.statusCode}, Latency: ${baseRes.latencyMs.toFixed(2)}ms, Token Received: ${!!baseRes.data?.token}`);
  results.baseline = { status: baseRes.statusCode, latencyMs: baseRes.latencyMs, success: !!baseRes.data?.token };

  // 2. Invalid Credentials Brute-Force Check
  console.log(`\n--- Stage 2: Invalid Credentials Check ---`);
  const invRes = await httpRequest({
    baseUrl,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'X-Forwarded-For': '10.0.0.2' },
    body: {
      email: 'admin@jaipur.manipal.edu',
      password: 'WrongPassword!999',
      role: 'admin'
    }
  });
  console.log(`Invalid login status: ${invRes.statusCode} (Expected 401), Latency: ${invRes.latencyMs.toFixed(2)}ms`);
  results.invalidCredentials = { status: invRes.statusCode, latencyMs: invRes.latencyMs };

  // 3. 50 Simultaneous Logins (testing bcrypt concurrency in Node.js threadpool)
  console.log(`\n--- Stage 3: 50 Concurrent Logins (Bcrypt Threadpool Test) ---`);
  const c50Collector = new MetricsCollector('50_concurrent_logins');
  c50Collector.start();
  const promises50 = Array.from({ length: 50 }, (_, i) =>
    httpRequest({
      baseUrl,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'X-Forwarded-For': `10.1.${Math.floor(i / 250)}.${i % 250}` },
      body: {
        email: 'admin@jaipur.manipal.edu',
        password: 'Admin@123',
        role: 'admin'
      }
    }).then(res => c50Collector.record(res.latencyMs, res.statusCode, res.error))
  );
  await Promise.all(promises50);
  c50Collector.stop();
  results.c50 = c50Collector.getSummary();
  console.log(`50 Logins - p50: ${results.c50.p50}ms, p95: ${results.c50.p95}ms, p99: ${results.c50.p99}ms, ErrorRate: ${results.c50.errorRatePct}%`);

  // 4. 100 Simultaneous Logins
  console.log(`\n--- Stage 4: 100 Concurrent Logins ---`);
  const c100Collector = new MetricsCollector('100_concurrent_logins');
  c100Collector.start();
  const promises100 = Array.from({ length: 100 }, (_, i) =>
    httpRequest({
      baseUrl,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'X-Forwarded-For': `10.2.${Math.floor(i / 250)}.${i % 250}` },
      body: {
        email: 'admin@jaipur.manipal.edu',
        password: 'Admin@123',
        role: 'admin'
      }
    }).then(res => c100Collector.record(res.latencyMs, res.statusCode, res.error))
  );
  await Promise.all(promises100);
  c100Collector.stop();
  results.c100 = c100Collector.getSummary();
  console.log(`100 Logins - p50: ${results.c100.p50}ms, p95: ${results.c100.p95}ms, p99: ${results.c100.p99}ms, ErrorRate: ${results.c100.errorRatePct}%`);

  // 5. 500 Simultaneous Logins
  console.log(`\n--- Stage 5: 500 Simultaneous Logins (Peak Auth Stress) ---`);
  const c500Collector = new MetricsCollector('500_simultaneous_logins');
  c500Collector.start();
  const promises500 = Array.from({ length: 500 }, (_, i) =>
    httpRequest({
      baseUrl,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'X-Forwarded-For': `10.5.${Math.floor(i / 250)}.${i % 250}` },
      body: {
        email: 'admin@jaipur.manipal.edu',
        password: 'Admin@123',
        role: 'admin'
      }
    }).then(res => c500Collector.record(res.latencyMs, res.statusCode, res.error))
  );
  await Promise.all(promises500);
  c500Collector.stop();
  results.c500 = c500Collector.getSummary();
  console.log(`500 Logins - p50: ${results.c500.p50}ms, p95: ${results.c500.p95}ms, p99: ${results.c500.p99}ms, RPS: ${results.c500.rps}, ErrorRate: ${results.c500.errorRatePct}%`);

  // 6. Token Verification Cache Throughput Under 500 Concurrent Users
  console.log(`\n--- Stage 6: Token Verification Cache (500 Concurrent Authenticated Calls) ---`);
  const token = signToken({ id: 'test_student_cache', email: 'cache@mujcode.internal', role: 'student' });
  const tokenCollector = new MetricsCollector('token_verification_throughput');
  tokenCollector.start();
  const tokenPromises = Array.from({ length: 500 }, (_, i) =>
    httpRequest({
      baseUrl,
      path: '/api/student/courses',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Forwarded-For': `10.9.${Math.floor(i / 250)}.${i % 250}`
      }
    }).then(res => tokenCollector.record(res.latencyMs, res.statusCode, res.error))
  );
  await Promise.all(tokenPromises);
  tokenCollector.stop();
  results.tokenVerification = tokenCollector.getSummary();
  console.log(`Token Verification Cache - p50: ${results.tokenVerification.p50}ms, p95: ${results.tokenVerification.p95}ms, RPS: ${results.tokenVerification.rps}, ErrorRate: ${results.tokenVerification.errorRatePct}%`);

  return results;
}
