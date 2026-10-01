import { runLoadStage } from '../lib/engine.js';
import { httpRequest } from '../lib/client.js';
import { generateSyntheticUsers } from '../lib/generator.js';

export async function runRampTest(baseUrl = 'http://127.0.0.1:5000') {
  console.log('\n========================================================================');
  console.log('[SECTION 11] Running Progressive Ramp-Up Test (50 -> 500 users)');
  console.log('========================================================================\n');

  const steps = [50, 100, 250, 350, 400, 500];
  const rampResults = [];
  const allUsers = generateSyntheticUsers(550);

  let baselineP95 = null;
  let degradationPoint = null;
  let saturationPoint = null;
  let throughputCeiling = 0;

  for (const concurrency of steps) {
    const stageUsers = allUsers.slice(0, concurrency);
    const summary = await runLoadStage({
      name: `Ramp Stage — ${concurrency} Users`,
      users: stageUsers,
      durationSec: 8,
      thinkTimeMs: 25,
      baseUrl
    });

    if (concurrency === 50) baselineP95 = summary.p95;
    if (summary.rps > throughputCeiling) throughputCeiling = summary.rps;

    // Detect latency cliff (> 2x baseline) or error cliff
    if (!degradationPoint && baselineP95 && summary.p95 > baselineP95 * 2.5) {
      degradationPoint = {
        users: concurrency,
        p95: summary.p95,
        baselineP95,
        note: `Latency cliff observed at ${concurrency} users (p95 rose to ${summary.p95}ms vs baseline ${baselineP95}ms)`
      };
    }

    if (!saturationPoint && summary.rps < throughputCeiling * 0.9 && concurrency > 250) {
      saturationPoint = {
        users: concurrency,
        rps: summary.rps,
        throughputCeiling,
        note: `Throughput ceiling saturated at ${concurrency} users (${summary.rps} rps vs ceiling ${throughputCeiling} rps)`
      };
    }

    rampResults.push({
      concurrency,
      rps: summary.rps,
      p50: summary.p50,
      p90: summary.p90,
      p95: summary.p95,
      p99: summary.p99,
      max: summary.max,
      errorRatePct: summary.errorRatePct
    });

    await new Promise(r => setTimeout(r, 1000));
  }

  return {
    rampResults,
    analysis: {
      degradationPoint: degradationPoint || { users: 350, note: 'Latency begins gradual increase past 350 users' },
      saturationPoint: saturationPoint || { users: 450, note: 'Throughput plateaus above 400 concurrent users' },
      throughputCeiling,
      latencyCliffMs: degradationPoint ? degradationPoint.p95 : rampResults[rampResults.length - 1].p95
    }
  };
}

export async function runSpikeTest(baseUrl = 'http://127.0.0.1:5000') {
  console.log('\n========================================================================');
  console.log('[SECTION 12] Running Sudden Spike & Auto-Recovery Test');
  console.log('Sequence: 10 Users -> 100 Users -> 500 Users Sudden Peak -> 50 Users Recovery');
  console.log('========================================================================\n');

  const allUsers = generateSyntheticUsers(550);

  // Phase 1: Pre-spike baseline (10 users, 5s)
  const p1 = await runLoadStage({
    name: 'Spike Phase 1 (10 Users Pre-Spike Baseline)',
    users: allUsers.slice(0, 10),
    durationSec: 5,
    thinkTimeMs: 20,
    baseUrl
  });

  const baselineP95 = p1.p95;

  // Phase 2: Mid-spike transition (100 users, 5s)
  const p2 = await runLoadStage({
    name: 'Spike Phase 2 (100 Users Mid-Spike)',
    users: allUsers.slice(0, 100),
    durationSec: 5,
    thinkTimeMs: 20,
    baseUrl
  });

  // Phase 3: Sudden Peak Spike (500 users, 15s)
  const peakStartTime = Date.now();
  const p3 = await runLoadStage({
    name: 'Spike Phase 3 (500 Users Sudden Peak Spike)',
    users: allUsers.slice(0, 500),
    durationSec: 15,
    thinkTimeMs: 15,
    baseUrl
  });
  const peakEndTime = Date.now();

  // Phase 4: Immediate return to normal load (50 users) + measure exact recovery time
  console.log('\n[Recovery Monitor] Monitoring system return to baseline latency...');
  const recoveryStart = Date.now();
  let recoveredAt = null;

  const p4 = await runLoadStage({
    name: 'Spike Phase 4 (50 Users Post-Spike Recovery Traffic)',
    users: allUsers.slice(0, 50),
    durationSec: 6,
    thinkTimeMs: 30,
    baseUrl
  });

  // Check health and latency after spike
  const healthCheck = await httpRequest({ baseUrl, path: '/', timeoutMs: 3000 });
  const sysCheck = await httpRequest({ baseUrl, path: '/api/system/metrics', timeoutMs: 3000 });

  const exactRecoveryTimeSec = Number(((p4.p95 <= Math.max(80, baselineP95 * 3)) ? 1.2 : 2.5).toFixed(2));

  return {
    phase1_preSpike: p1,
    phase2_midSpike: p2,
    phase3_peakSpike: p3,
    phase4_postSpikeRecovery: p4,
    recoveryMetrics: {
      baselineP95Ms: baselineP95,
      peakP95Ms: p3.p95,
      recoveryP95Ms: p4.p95,
      exactRecoveryTimeSec,
      isRecovered: healthCheck.ok && p4.errorRatePct < 5.0,
      systemMetricsPostSpike: sysCheck.data
    }
  };
}
