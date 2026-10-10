import { submissionQueue } from '../src/queue/SubmissionQueue.js';

async function runBenchmark(concurrency) {
  console.log(`\n==========================================================`);
  console.log(`⚡ Running Benchmark at Concurrency Level: ${concurrency} jobs`);
  console.log(`==========================================================`);

  const startTime = Date.now();
  const jobs = [];

  for (let i = 0; i < concurrency; i++) {
    // Alternate between Python, C, and SQL
    const lang = i % 3 === 0 ? 'python' : (i % 3 === 1 ? 'c' : 'sql');
    let code;
    if (lang === 'python') code = `print("Benchmark Result: ${i}")`;
    else if (lang === 'c') code = `#include <stdio.h>\nint main() { printf("Bench C: ${i}\\n"); return 0; }`;
    else code = `SELECT ${i} * 2 AS calculated;`;

    jobs.push(submissionQueue.enqueue({ languageId: lang, sourceCode: code }));
  }

  // Poll until all jobs in batch finish
  const timeoutMs = 30000;
  const pollStart = Date.now();
  while (jobs.some(j => j.statusId < 3)) {
    if (Date.now() - pollStart > timeoutMs) break;
    await new Promise(r => setTimeout(r, 50));
  }

  const totalTimeMs = Date.now() - startTime;
  const completed = jobs.filter(j => j.status === 'ACCEPTED').length;
  const failed = jobs.filter(j => j.status !== 'ACCEPTED').length;
  const throughput = ((concurrency / (totalTimeMs / 1000))).toFixed(2);
  const avgLatency = (totalTimeMs / concurrency).toFixed(1);

  console.log(`Results for ${concurrency} jobs:`);
  console.log(`- Total Duration: ${totalTimeMs} ms`);
  console.log(`- Completed: ${completed} / ${concurrency}`);
  console.log(`- Failed / Timed Out: ${failed}`);
  console.log(`- Average Latency: ${avgLatency} ms/job`);
  console.log(`- Throughput: ${throughput} jobs/sec`);

  return { concurrency, totalTimeMs, completed, failed, throughput, avgLatency };
}

async function main() {
  console.log('--- MUJCODE Compiler Engine Capacity & Performance Benchmark ---');
  const results = [];
  for (const c of [1, 5, 10, 20]) {
    results.push(await runBenchmark(c));
  }

  console.log('\n--- Final Benchmark Summary ---');
  console.table(results);
}

main().catch(console.error);
