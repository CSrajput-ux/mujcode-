import { runLoadStage } from '../lib/engine.js';
import { httpRequest } from '../lib/client.js';
import { generateSyntheticUsers } from '../lib/generator.js';

export async function runReproducibilityTests(baseUrl = 'http://127.0.0.1:5000') {
  console.log('\n========================================================================');
  console.log('[SECTION 26] Running Three-Run Reproducibility Suite (500 Users × 3 Runs)');
  console.log('========================================================================\n');

  const allUsers = generateSyntheticUsers(500);
  const runs = [];

  // 2-second socket pool warm-up
  console.log('[Reproducibility] Warming up connection pool before Run 1...');
  await Promise.all(allUsers.slice(0, 50).map(u => httpRequest({ baseUrl, path: '/', timeoutMs: 3000 })));
  await new Promise(r => setTimeout(r, 2000));

  for (let i = 1; i <= 3; i++) {
    console.log(`\n--- Executing Reproducibility Run ${i} / 3 (500 Concurrent Users) ---`);
    
    // Fetch initial sys metrics
    const preSys = await httpRequest({ baseUrl, path: '/api/system/metrics', timeoutMs: 3000 });

    const summary = await runLoadStage({
      name: `Reproducibility Run ${i} (500 Users)`,
      users: allUsers,
      durationSec: 15,
      thinkTimeMs: 40,
      baseUrl
    });

    // Fetch post sys metrics
    const postSys = await httpRequest({ baseUrl, path: '/api/system/metrics', timeoutMs: 3000 });

    runs.push({
      runNumber: i,
      test_start_timestamp: summary.test_start_timestamp,
      test_end_timestamp: summary.test_end_timestamp,
      exact_elapsed_seconds: summary.exact_elapsed_seconds,
      requests_completed: summary.requests_completed,
      successful_requests: summary.successful_requests,
      requests_failed: summary.requests_failed,
      actual_RPS: summary.actual_RPS,
      p50: summary.p50,
      p90: summary.p90,
      p95: summary.p95,
      p99: summary.p99,
      max: summary.max,
      errorRatePct: summary.errorRatePct,
      systemMetricsPre: preSys.data?.memory,
      systemMetricsPost: postSys.data?.memory
    });

    console.log(`  -> Run ${i} Finished: RPS=${summary.actual_RPS} | p50=${summary.p50}ms | p95=${summary.p95}ms | Errors=${summary.requests_failed}`);

    // Wait 2 seconds between runs
    await new Promise(r => setTimeout(r, 2000));
  }

  // Calculate variances across the 3 runs
  const rpsValues = runs.map(r => r.actual_RPS);
  const p50Values = runs.map(r => r.p50);
  const p95Values = runs.map(r => r.p95);
  const p99Values = runs.map(r => r.p99);

  const calcMean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const calcVariance = (arr) => {
    const mean = calcMean(arr);
    return arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / arr.length;
  };
  const calcStdDev = (arr) => Math.sqrt(calcVariance(arr));
  const calcCvPct = (arr) => {
    const mean = calcMean(arr);
    return mean > 0 ? Number(((calcStdDev(arr) / mean) * 100).toFixed(2)) : 0;
  };

  const analysis = {
    rps: { mean: Number(calcMean(rpsValues).toFixed(2)), stdDev: Number(calcStdDev(rpsValues).toFixed(2)), cvPct: calcCvPct(rpsValues) },
    p50: { mean: Number(calcMean(p50Values).toFixed(2)), stdDev: Number(calcStdDev(p50Values).toFixed(2)), cvPct: calcCvPct(p50Values) },
    p95: { mean: Number(calcMean(p95Values).toFixed(2)), stdDev: Number(calcStdDev(p95Values).toFixed(2)), cvPct: calcCvPct(p95Values) },
    p99: { mean: Number(calcMean(p99Values).toFixed(2)), stdDev: Number(calcStdDev(p99Values).toFixed(2)), cvPct: calcCvPct(p99Values) },
    isReproducible: calcCvPct(p50Values) < 15.0 && calcCvPct(rpsValues) < 15.0
  };

  console.log(`\nReproducibility Analysis:`);
  console.log(`  RPS Mean: ${analysis.rps.mean} (CV: ${analysis.rps.cvPct}%)`);
  console.log(`  p50 Mean: ${analysis.p50.mean}ms (CV: ${analysis.p50.cvPct}%)`);
  console.log(`  p95 Mean: ${analysis.p95.mean}ms (CV: ${analysis.p95.cvPct}%)`);
  console.log(`  Reproducibility Verdict: ${analysis.isReproducible ? 'PASSED (Low variance < 15%)' : 'HIGH VARIANCE'}`);

  return {
    runs,
    analysis
  };
}
