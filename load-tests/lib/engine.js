import { MetricsCollector } from './metrics.js';
import { runUserStep } from './workflows.js';

export async function runLoadStage({
  name,
  users,
  durationSec = 10,
  thinkTimeMs = 20,
  baseUrl = 'http://127.0.0.1:5000'
}) {
  const collector = new MetricsCollector(name);
  collector.start();

  const stopTime = Date.now() + durationSec * 1000;
  const userCount = users.length;

  console.log(`\n===============================================================`);
  console.log(`[STAGE START] ${name} | Concurrency: ${userCount} users | Duration: ${durationSec}s`);
  console.log(`===============================================================`);

  // Each virtual user runs an independent async loop until stopTime
  const promises = users.map(async (user, idx) => {
    // Stagger start slightly to avoid stampede on ms 0
    await new Promise(r => setTimeout(r, (idx % 50) * 10));

    while (Date.now() < stopTime) {
      try {
        const res = await runUserStep(user, baseUrl);
        collector.record(res.latencyMs, res.statusCode, res.error);
      } catch (err) {
        collector.record(0, 500, err);
      }

      if (thinkTimeMs > 0) {
        // Realistic jitter: +/- 50%
        const jitter = Math.floor(thinkTimeMs * (0.5 + Math.random()));
        await new Promise(r => setTimeout(r, jitter));
      }
    }
  });

  await Promise.all(promises);
  collector.stop();

  const summary = collector.getSummary();
  console.log(`[STAGE DONE] ${name}`);
  console.log(`  Requests: ${summary.totalRequests} | RPS: ${summary.rps} | Errors: ${summary.failedRequests} (${summary.errorRatePct}%)`);
  console.log(`  p50: ${summary.p50}ms | p90: ${summary.p90}ms | p95: ${summary.p95}ms | p99: ${summary.p99}ms | Max: ${summary.max}ms`);

  return summary;
}
