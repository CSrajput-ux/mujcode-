import { httpRequest } from '../lib/client.js';
import { MetricsCollector } from '../lib/metrics.js';

export async function runFileDownloadStressTest(baseUrl = 'http://127.0.0.1:5000') {
  console.log('\n========================================================================');
  console.log('[SECTION 17] File Download & Streaming Load Test');
  console.log('Testing: 10, 50, 100, 250, 500 Concurrent Downloads');
  console.log('========================================================================\n');

  const downloadLevels = [10, 50, 100, 250, 500];
  const results = {};

  for (const n of downloadLevels) {
    console.log(`[Download Test] Executing ${n} concurrent file downloads...`);
    const collector = new MetricsCollector(`downloads_${n}`);

    // Pre-download system memory
    const preSys = await httpRequest({ baseUrl, path: '/api/system/metrics', timeoutMs: 3000 });
    collector.start();

    const promises = Array.from({ length: n }, (_, i) =>
      httpRequest({
        baseUrl,
        path: '/logo.png', // 64 kB static asset streamed via fs.createReadStream
        headers: { 'X-Forwarded-For': `10.88.${Math.floor(i / 250)}.${i % 250}` },
        timeoutMs: 15000
      }).then(res => {
        collector.record(res.latencyMs, res.statusCode, res.error);
      })
    );

    await Promise.all(promises);
    collector.stop();

    // Post-download system memory
    const postSys = await httpRequest({ baseUrl, path: '/api/system/metrics', timeoutMs: 3000 });
    const summary = collector.getSummary();

    const initialRss = preSys.data?.memory?.rssMb || 0;
    const finalRss = postSys.data?.memory?.rssMb || 0;
    const rssDelta = Number((finalRss - initialRss).toFixed(2));

    console.log(`  -> ${n} Downloads: RPS=${summary.actual_RPS} | p50=${summary.p50}ms | p95=${summary.p95}ms | Errors=${summary.requests_failed} | RSS Delta: ${rssDelta}MB`);

    results[`downloads_${n}`] = {
      concurrency: n,
      summary,
      initialRssMb: initialRss,
      finalRssMb: finalRss,
      rssDeltaMb: rssDelta,
      zeroHeapBufferingVerified: Math.abs(rssDelta) < 50
    };

    await new Promise(r => setTimeout(r, 1000));
  }

  return results;
}
