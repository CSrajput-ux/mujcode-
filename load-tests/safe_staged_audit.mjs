import { runLoadStage } from './lib/engine.js';
import { generateSyntheticUsers } from './lib/generator.js';
import { httpRequest } from './lib/client.js';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5000';

async function runSafeStagedAudit() {
  console.log(`========================================================================`);
  console.log(`  MUJCODE SAFE STAGED PERFORMANCE AUDIT`);
  console.log(`  Target: ${BASE_URL} | Time: ${new Date().toISOString()}`);
  console.log(`========================================================================\n`);

  // Step 1: Baseline health check
  console.log(`[STAGE 0] Checking baseline API & Compiler health...`);
  const rootRes = await httpRequest({ baseUrl: BASE_URL, path: '/' });
  const compRes = await httpRequest({ baseUrl: BASE_URL, path: '/api/compiler/health' });
  console.log(`  Root Health: ${rootRes.statusCode} (${rootRes.data?.name || 'OK'})`);
  console.log(`  Compiler Health: ${compRes.statusCode} (Healthy: ${compRes.data?.healthy})`);

  if (rootRes.statusCode !== 200) {
    throw new Error(`Server root not healthy: ${rootRes.statusCode}`);
  }

  // Step 2: Generate realistic virtual users
  const allUsers = generateSyntheticUsers(50);
  const auditReport = {
    target: BASE_URL,
    timestamp: new Date().toISOString(),
    stages: []
  };

  // Stage 1: 1 Virtual User (duration 3s)
  const s1 = await runLoadStage({
    name: 'Stage 1 — 1 User Baseline',
    users: allUsers.slice(0, 1),
    durationSec: 3,
    thinkTimeMs: 15,
    baseUrl: BASE_URL
  });
  auditReport.stages.push({ users: 1, ...s1 });

  // Stage 2: 5 Virtual Users (duration 3s)
  const s5 = await runLoadStage({
    name: 'Stage 2 — 5 Concurrent Users',
    users: allUsers.slice(0, 5),
    durationSec: 3,
    thinkTimeMs: 15,
    baseUrl: BASE_URL
  });
  auditReport.stages.push({ users: 5, ...s5 });

  // Stage 3: 10 Virtual Users (duration 4s)
  const s10 = await runLoadStage({
    name: 'Stage 3 — 10 Concurrent Users',
    users: allUsers.slice(0, 10),
    durationSec: 4,
    thinkTimeMs: 20,
    baseUrl: BASE_URL
  });
  auditReport.stages.push({ users: 10, ...s10 });

  // Stage 4: 25 Virtual Users (duration 4s)
  const s25 = await runLoadStage({
    name: 'Stage 4 — 25 Concurrent Users',
    users: allUsers.slice(0, 25),
    durationSec: 4,
    thinkTimeMs: 25,
    baseUrl: BASE_URL
  });
  auditReport.stages.push({ users: 25, ...s25 });

  // Step 3: Concurrency Race / Duplicate Application Test
  console.log(`\n[STAGE 5] Running Concurrency Race (25 concurrent identical applications)...`);
  const testStudentId = `stu_race_${Date.now()}`;
  const testJobId = 9999;
  const raceToken = allUsers[0].token;
  const raceHeaders = {
    'Authorization': `Bearer ${raceToken}`,
    'X-Forwarded-For': '10.50.1.1'
  };

  const racePromises = Array.from({ length: 25 }, () =>
    httpRequest({
      baseUrl: BASE_URL,
      path: '/api/placements/apply',
      method: 'POST',
      headers: raceHeaders,
      body: { jobId: testJobId }
    })
  );

  const raceResponses = await Promise.all(racePromises);
  const raceStatuses = {};
  raceResponses.forEach(r => raceStatuses[r.statusCode] = (raceStatuses[r.statusCode] || 0) + 1);
  console.log(`  Race Status Distribution:`, raceStatuses);

  // Summary Table
  console.log(`\n========================================================================`);
  console.log(`  AUDIT BENCHMARK SUMMARY`);
  console.log(`========================================================================`);
  console.table(auditReport.stages.map(s => ({
    Stage: s.name,
    Users: s.users,
    TotalRequests: s.totalRequests,
    RPS: s.rps,
    p50_ms: s.p50,
    p95_ms: s.p95,
    p99_ms: s.p99,
    ErrorRatePct: `${s.errorRatePct}%`
  })));
  console.log(`\nAudit completed successfully.`);
}

runSafeStagedAudit().catch(err => {
  console.error('[SafeAudit] Fatal error:', err);
  process.exit(1);
});
