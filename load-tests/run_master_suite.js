import fs from 'node:fs';
import path from 'node:path';
import { generateSyntheticUsers } from './lib/generator.js';
import { runLoadStage } from './lib/engine.js';
import { runAuthStressTest } from './scenarios/auth_stress.js';
import { runConcurrencyRaceTest } from './scenarios/concurrency_race.js';
import { runRateLimitTest } from './scenarios/ratelimit_test.js';
import { runSecurityLoadTest } from './scenarios/security_load_test.js';
import { runApiBenchmark } from './scenarios/api_benchmark.js';
import { runSearchPaginationTest } from './scenarios/search_pagination.js';
import { httpRequest } from './lib/client.js';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5000';

async function getSystemMetrics() {
  try {
    const res = await httpRequest({ baseUrl: BASE_URL, path: '/metrics' });
    const memUsage = process.memoryUsage();
    return {
      status: res.statusCode,
      metricsLength: typeof res.data === 'string' ? res.data.length : 0,
      memory: {
        rssMb: Number((memUsage.rss / 1024 / 1024).toFixed(2)),
        heapUsedMb: Number((memUsage.heapUsed / 1024 / 1024).toFixed(2)),
        heapTotalMb: Number((memUsage.heapTotal / 1024 / 1024).toFixed(2))
      }
    };
  } catch (err) {
    return { error: err.message };
  }
}

async function main() {
  console.log(`========================================================================`);
  console.log(`  MUJCODE PRODUCTION-GRADE 500 CONCURRENT USERS SYSTEM PERFORMANCE TEST`);
  console.log(`  Target: ${BASE_URL} | Time: ${new Date().toISOString()}`);
  console.log(`========================================================================\n`);

  const report = {
    metadata: {
      timestamp: new Date().toISOString(),
      target: BASE_URL,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    },
    systemMetricsInitial: await getSystemMetrics(),
    scenarios: {}
  };

  // Generate 550 synthetic users across all 5 personas
  console.log(`[GENERATOR] Creating 550 synthetic users across 5 realistic personas...`);
  const allUsers = generateSyntheticUsers(550);
  console.log(`[GENERATOR] Successfully created ${allUsers.length} synthetic user personas with valid HMAC-SHA256 tokens.\n`);

  // --- 1. BASELINE TEST (1, 5, 10 users) ---
  console.log(`>>> STARTING BASELINE TESTS (1, 5, 10 Users)`);
  report.scenarios.baseline_1 = await runLoadStage({
    name: 'Baseline 1 User',
    users: allUsers.slice(0, 1),
    durationSec: 5,
    thinkTimeMs: 10,
    baseUrl: BASE_URL
  });

  report.scenarios.baseline_5 = await runLoadStage({
    name: 'Baseline 5 Users',
    users: allUsers.slice(0, 5),
    durationSec: 5,
    thinkTimeMs: 10,
    baseUrl: BASE_URL
  });

  report.scenarios.baseline_10 = await runLoadStage({
    name: 'Baseline 10 Users',
    users: allUsers.slice(0, 10),
    durationSec: 5,
    thinkTimeMs: 10,
    baseUrl: BASE_URL
  });

  // --- 2. LOAD TESTS (50, 100, 250 users) ---
  console.log(`\n>>> STARTING LOAD TESTS (50, 100, 250 Users)`);
  report.scenarios.load_50 = await runLoadStage({
    name: 'Load Test 50 Concurrent Users',
    users: allUsers.slice(0, 50),
    durationSec: 10,
    thinkTimeMs: 15,
    baseUrl: BASE_URL
  });

  report.scenarios.load_100 = await runLoadStage({
    name: 'Load Test 100 Concurrent Users',
    users: allUsers.slice(0, 100),
    durationSec: 10,
    thinkTimeMs: 20,
    baseUrl: BASE_URL
  });

  report.scenarios.load_250 = await runLoadStage({
    name: 'Load Test 250 Concurrent Users',
    users: allUsers.slice(0, 250),
    durationSec: 12,
    thinkTimeMs: 20,
    baseUrl: BASE_URL
  });

  // --- 3. PRIMARY TEST: 500 CONCURRENT USERS ---
  console.log(`\n>>> STARTING PRIMARY TEST: 500 CONCURRENT USERS (Full Persona Mix)`);
  report.scenarios.load_500 = await runLoadStage({
    name: 'Primary 500 Concurrent Users Load Test',
    users: allUsers.slice(0, 500),
    durationSec: 20,
    thinkTimeMs: 25,
    baseUrl: BASE_URL
  });

  // --- 4. RAMP-UP TEST (0 -> 25 -> 50 -> 100 -> 200 -> 300 -> 400 -> 500) ---
  console.log(`\n>>> STARTING RAMP-UP TEST (Stepwise 0 to 500 Users)`);
  const rampStages = [25, 50, 100, 200, 300, 400, 500];
  report.scenarios.ramp_up = [];
  for (const stepUsers of rampStages) {
    const res = await runLoadStage({
      name: `Ramp-Up Step: ${stepUsers} Users`,
      users: allUsers.slice(0, stepUsers),
      durationSec: 6,
      thinkTimeMs: 20,
      baseUrl: BASE_URL
    });
    report.scenarios.ramp_up.push({
      concurrency: stepUsers,
      rps: res.rps,
      p50: res.p50,
      p90: res.p90,
      p95: res.p95,
      p99: res.p99,
      max: res.max,
      errorPct: res.errorRatePct
    });
  }

  // --- 5. SPIKE TEST (10 -> 100 -> 500 -> 50) ---
  console.log(`\n>>> STARTING SPIKE TEST (10 -> 100 -> 500 -> 50 Users)`);
  report.scenarios.spike_test = {
    phase1_preSpike: await runLoadStage({
      name: 'Spike Phase 1 (10 Users Pre-Spike)',
      users: allUsers.slice(0, 10),
      durationSec: 5,
      baseUrl: BASE_URL
    }),
    phase2_midSpike: await runLoadStage({
      name: 'Spike Phase 2 (100 Users Mid-Spike)',
      users: allUsers.slice(0, 100),
      durationSec: 5,
      baseUrl: BASE_URL
    }),
    phase3_peakSpike: await runLoadStage({
      name: 'Spike Phase 3 (500 Users Sudden Peak Spike)',
      users: allUsers.slice(0, 500),
      durationSec: 10,
      baseUrl: BASE_URL
    }),
    phase4_postSpikeRecovery: await runLoadStage({
      name: 'Spike Phase 4 (50 Users Post-Spike Recovery)',
      users: allUsers.slice(0, 50),
      durationSec: 5,
      baseUrl: BASE_URL
    })
  };

  // --- 6. SOAK / ENDURANCE TEST (250 Users Sustained) ---
  console.log(`\n>>> STARTING SOAK / ENDURANCE TEST (250 Sustained Concurrent Users)`);
  report.scenarios.endurance_test = await runLoadStage({
    name: 'Endurance Soak Test (250 Users Sustained)',
    users: allUsers.slice(0, 250),
    durationSec: 25,
    thinkTimeMs: 15,
    baseUrl: BASE_URL
  });

  // --- 7. API PERFORMANCE BENCHMARK (15 Critical Endpoints) ---
  console.log(`\n>>> STARTING API PERFORMANCE BENCHMARK (Individual Critical Endpoints)`);
  report.scenarios.api_benchmark = await runApiBenchmark(BASE_URL);

  // --- 8. AUTHENTICATION LOAD TEST ---
  console.log(`\n>>> STARTING AUTHENTICATION STRESS TEST`);
  report.scenarios.auth_stress = await runAuthStressTest(BASE_URL);

  // --- 9. CONCURRENCY & RACE CONDITIONS TEST ---
  console.log(`\n>>> STARTING CONCURRENCY & RACE CONDITION TEST`);
  report.scenarios.concurrency_race = await runConcurrencyRaceTest(BASE_URL);

  // --- 10. RATE LIMITING TEST ---
  console.log(`\n>>> STARTING RATE LIMITING TEST`);
  report.scenarios.rate_limiting = await runRateLimitTest(BASE_URL);

  // --- 11. SEARCH & PAGINATION TEST ---
  console.log(`\n>>> STARTING SEARCH & PAGINATION TEST`);
  report.scenarios.search_pagination = await runSearchPaginationTest(BASE_URL);

  // --- 12. SECURITY UNDER LOAD TEST ---
  console.log(`\n>>> STARTING SECURITY UNDER LOAD TEST`);
  report.scenarios.security_load = await runSecurityLoadTest(BASE_URL);

  // System metrics final
  report.systemMetricsFinal = await getSystemMetrics();

  // Save raw results to JSON file
  const outputPath = path.resolve('load_test_results.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n========================================================================`);
  console.log(`  ALL PERFORMANCE TEST SCENARIOS COMPLETED SUCCESSFULLY!`);
  console.log(`  Full results saved to: ${outputPath}`);
  console.log(`========================================================================\n`);

  process.exit(0);
}

main().catch(err => {
  console.error('[FATAL] Master test runner encountered error:', err);
  process.exit(1);
});
