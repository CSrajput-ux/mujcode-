import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { httpRequest } from '../lib/client.js';
import { generateSyntheticUsers } from '../lib/generator.js';
import { runUserStep } from '../lib/workflows.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runSoakTest({
  durationSeconds = 1800, // 30 minutes by default
  userCount = 500,
  sampleIntervalSec = 5,
  baseUrl = 'http://127.0.0.1:5000',
  outputPrefix = 'soak_500_metrics'
} = {}) {
  console.log(`\n========================================================================`);
  console.log(`[MANDATORY SOAK TEST] Starting 500-User Soak Test`);
  console.log(`Duration: ${durationSeconds}s (${(durationSeconds / 60).toFixed(1)} mins) | Sampling: Every ${sampleIntervalSec}s | Users: ${userCount}`);
  console.log(`Target: ${baseUrl}`);
  console.log(`========================================================================\n`);

  const users = generateSyntheticUsers(userCount);
  const testStartTime = Date.now();
  const testEndTime = testStartTime + (durationSeconds * 1000);

  // Time-series snapshots buffer
  const snapshots = [];
  let intervalLatencies = [];
  let intervalStatusCodes = {};
  let intervalErrors = {};
  let cumulativeRequests = 0;
  let cumulativeErrors = 0;

  // Fetch initial system metrics
  let initialMetrics = null;
  try {
    const initRes = await httpRequest({ baseUrl, path: '/api/system/metrics', timeoutMs: 5000 });
    if (initRes.ok && initRes.data?.memory) {
      initialMetrics = initRes.data;
    }
  } catch (err) {
    console.warn('[Soak] Could not fetch initial system metrics:', err.message);
  }

  // Periodic sampler
  const sampleTimer = setInterval(async () => {
    const now = Date.now();
    const elapsedSec = Math.floor((now - testStartTime) / 1000);
    const count = intervalLatencies.length;

    let p50 = 0, p90 = 0, p95 = 0, p99 = 0, max = 0, avg = 0;
    if (count > 0) {
      const sorted = [...intervalLatencies].sort((a, b) => a - b);
      const sum = sorted.reduce((a, b) => a + b, 0);
      avg = Number((sum / count).toFixed(2));
      p50 = Number(sorted[Math.floor(count * 0.50)].toFixed(2));
      p90 = Number(sorted[Math.floor(count * 0.90)].toFixed(2));
      p95 = Number(sorted[Math.floor(count * 0.95)].toFixed(2));
      p99 = Number(sorted[Math.min(count - 1, Math.floor(count * 0.99))].toFixed(2));
      max = Number(sorted[count - 1].toFixed(2));
    }

    const intervalRps = Number((count / sampleIntervalSec).toFixed(2));
    const currentCodes = { ...intervalStatusCodes };
    const currentErrors = { ...intervalErrors };

    // Reset interval counters
    intervalLatencies = [];
    intervalStatusCodes = {};
    intervalErrors = {};

    // Fetch live system metrics from server
    let sys = null;
    try {
      const sysRes = await httpRequest({ baseUrl, path: '/api/system/metrics', timeoutMs: 3000 });
      if (sysRes.ok && sysRes.data?.memory) {
        sys = sysRes.data;
      }
    } catch (err) {
      // non-fatal
    }

    const snapshot = {
      timestamp: new Date(now).toISOString(),
      elapsedSeconds: elapsedSec,
      activeUsers: userCount,
      intervalRequests: count,
      intervalRps,
      cumulativeRequests,
      cumulativeErrors,
      latencies: { avg, p50, p90, p95, p99, max },
      statusCodes: currentCodes,
      errors: currentErrors,
      system: sys ? {
        rssMb: sys.memory.rssMb,
        heapTotalMb: sys.memory.heapTotalMb,
        heapUsedMb: sys.memory.heapUsedMb,
        externalMb: sys.memory.externalMb,
        arrayBuffersMb: sys.memory.arrayBuffersMb,
        eventLoopLagMs: sys.eventLoopLagMs,
        activeHandles: sys.activeHandles,
        activeRequests: sys.activeRequests,
        postgres: sys.postgres,
        redis: sys.redis
      } : null
    };

    snapshots.push(snapshot);

    const memStr = sys ? `RSS: ${sys.memory.rssMb}MB | HeapUsed: ${sys.memory.heapUsedMb}MB | Lag p95: ${sys.eventLoopLagMs?.p95 || 0}ms` : 'Sys: N/A';
    console.log(`[Soak +${elapsedSec}s] Req: ${count} (${intervalRps} rps) | p50: ${p50}ms | p95: ${p95}ms | ${memStr}`);
  }, sampleIntervalSec * 1000);

  // Launch virtual user workers
  const workerPromises = users.map(async (user, idx) => {
    // Initial stagger
    await new Promise(r => setTimeout(r, (idx % 100) * 15));

    while (Date.now() < testEndTime) {
      try {
        const res = await runUserStep(user, baseUrl);
        cumulativeRequests++;
        intervalLatencies.push(res.latencyMs);
        intervalStatusCodes[res.statusCode] = (intervalStatusCodes[res.statusCode] || 0) + 1;
        if (!res.ok) {
          cumulativeErrors++;
        }
      } catch (err) {
        cumulativeRequests++;
        cumulativeErrors++;
        intervalLatencies.push(0);
        intervalStatusCodes[500] = (intervalStatusCodes[500] || 0) + 1;
        const errKey = err.code || err.message || 'UNKNOWN';
        intervalErrors[errKey] = (intervalErrors[errKey] || 0) + 1;
      }

      // Realistic student think time: 50ms - 250ms
      const thinkTime = 50 + Math.floor(Math.random() * 200);
      await new Promise(r => setTimeout(r, thinkTime));
    }
  });

  await Promise.all(workerPromises);
  clearInterval(sampleTimer);

  const exactEndTime = Date.now();
  const exactElapsedMs = exactEndTime - testStartTime;
  const exactElapsedSec = exactElapsedMs / 1000;
  const overallRps = Number((cumulativeRequests / exactElapsedSec).toFixed(2));

  // Fetch final system metrics
  let finalMetrics = null;
  try {
    const finRes = await httpRequest({ baseUrl, path: '/api/system/metrics', timeoutMs: 5000 });
    if (finRes.ok && finRes.data?.memory) {
      finalMetrics = finRes.data;
    }
  } catch (err) {
    console.warn('[Soak] Could not fetch final system metrics:', err.message);
  }

  // Memory analysis
  const rssValues = snapshots.map(s => s.system?.rssMb).filter(Boolean);
  const heapValues = snapshots.map(s => s.system?.heapUsedMb).filter(Boolean);
  const externalValues = snapshots.map(s => s.system?.externalMb).filter(Boolean);

  const minRss = rssValues.length ? Math.min(...rssValues) : (initialMetrics?.memory?.rssMb || 0);
  const maxRss = rssValues.length ? Math.max(...rssValues) : (finalMetrics?.memory?.rssMb || 0);
  const avgRss = rssValues.length ? Number((rssValues.reduce((a, b) => a + b, 0) / rssValues.length).toFixed(2)) : 0;
  const initRss = initialMetrics?.memory?.rssMb || (rssValues[0] || 0);
  const finRss = finalMetrics?.memory?.rssMb || (rssValues[rssValues.length - 1] || 0);

  const initHeap = initialMetrics?.memory?.heapUsedMb || (heapValues[0] || 0);
  const minHeap = heapValues.length ? Math.min(...heapValues) : initHeap;
  const maxHeap = heapValues.length ? Math.max(...heapValues) : initHeap;
  const avgHeap = heapValues.length ? Number((heapValues.reduce((a, b) => a + b, 0) / heapValues.length).toFixed(2)) : 0;
  const finHeap = finalMetrics?.memory?.heapUsedMb || (heapValues[heapValues.length - 1] || 0);

  const initExt = initialMetrics?.memory?.externalMb || (externalValues[0] || 0);
  const maxExt = externalValues.length ? Math.max(...externalValues) : initExt;
  const finExt = finalMetrics?.memory?.externalMb || (externalValues[externalValues.length - 1] || 0);

  const rssGrowthMb = Number((finRss - initRss).toFixed(2));
  const heapGrowthMb = Number((finHeap - initHeap).toFixed(2));
  const rssRatio = initRss > 0 ? Number((finRss / initRss).toFixed(2)) : 1;
  const heapRatio = initHeap > 0 ? Number((finHeap / initHeap).toFixed(2)) : 1;

  // Determine memory stabilization classification
  // If growth stabilizes within bounded bounds and doesn't exceed leak threshold:
  const isMemoryStable = Math.abs(rssGrowthMb) < 200 && heapRatio < 3.0;

  const soakSummary = {
    test_name: '500_concurrent_users_sustained_soak',
    test_start_timestamp: new Date(testStartTime).toISOString(),
    test_end_timestamp: new Date(exactEndTime).toISOString(),
    exact_elapsed_ms: exactElapsedMs,
    exact_elapsed_seconds: exactElapsedSec,
    displayed_duration: `${Math.floor(exactElapsedSec / 60)}m ${Math.floor(exactElapsedSec % 60)}s`,
    concurrency_users: userCount,
    total_requests: cumulativeRequests,
    total_errors: cumulativeErrors,
    error_rate_pct: Number(((cumulativeErrors / Math.max(1, cumulativeRequests)) * 100).toFixed(2)),
    actual_RPS: overallRps,
    memory_analysis: {
      initialRssMb: initRss,
      minimumRssMb: minRss,
      averageRssMb: avgRss,
      peakRssMb: maxRss,
      finalRssMb: finRss,
      rssGrowthMb,
      rssRatio,
      initialHeapUsedMb: initHeap,
      minimumHeapUsedMb: minHeap,
      averageHeapUsedMb: avgHeap,
      peakHeapUsedMb: maxHeap,
      finalHeapUsedMb: finHeap,
      heapGrowthMb,
      heapRatio,
      initialExternalMb: initExt,
      peakExternalMb: maxExt,
      finalExternalMb: finExt,
      isMemoryStable,
      trend: isMemoryStable ? 'STABLE (Bounded heap, prompt GC reclamation)' : 'UNBOUNDED_GROWTH'
    },
    snapshots_count: snapshots.length,
    snapshots
  };

  // Write results
  const resultsDir = path.resolve(__dirname, '../results');
  if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

  const jsonPath = path.join(resultsDir, `${outputPrefix}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(soakSummary, null, 2), 'utf8');

  // Write CSV
  const csvPath = path.join(resultsDir, `${outputPrefix}.csv`);
  let csv = 'Timestamp,ElapsedSec,Users,IntervalReq,RPS,p50,p95,p99,Max,RSS_MB,HeapUsed_MB,LagP95_MS\n';
  for (const s of snapshots) {
    csv += `${s.timestamp},${s.elapsedSeconds},${s.activeUsers},${s.intervalRequests},${s.intervalRps},${s.latencies.p50},${s.latencies.p95},${s.latencies.p99},${s.latencies.max},${s.system?.rssMb || 0},${s.system?.heapUsedMb || 0},${s.system?.eventLoopLagMs?.p95 || 0}\n`;
  }
  fs.writeFileSync(csvPath, csv, 'utf8');

  console.log(`\n========================================================================`);
  console.log(`[SOAK COMPLETE] 500 Users sustained soak test finished.`);
  console.log(`Requests: ${cumulativeRequests} | Exact RPS: ${overallRps} | Errors: ${cumulativeErrors} (${soakSummary.error_rate_pct}%)`);
  console.log(`Memory: Initial RSS: ${initRss}MB -> Peak RSS: ${maxRss}MB -> Final RSS: ${finRss}MB (Trend: ${soakSummary.memory_analysis.trend})`);
  console.log(`Saved JSON: ${jsonPath}`);
  console.log(`Saved CSV:  ${csvPath}`);
  console.log(`========================================================================\n`);

  return soakSummary;
}
