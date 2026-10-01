import { runLoadStage } from '../lib/engine.js';
import { generateSyntheticUsers } from '../lib/generator.js';

export async function runGraduatedLoad(baseUrl = 'http://127.0.0.1:5000') {
  console.log('\n========================================================================');
  console.log('[SECTION 10] Running Graduated Load Levels (1 -> 500 users)');
  console.log('========================================================================\n');

  const levels = [
    { users: 1, durationSec: 5, thinkTimeMs: 10 },
    { users: 5, durationSec: 5, thinkTimeMs: 15 },
    { users: 10, durationSec: 5, thinkTimeMs: 20 },
    { users: 25, durationSec: 6, thinkTimeMs: 20 },
    { users: 50, durationSec: 8, thinkTimeMs: 25 },
    { users: 100, durationSec: 8, thinkTimeMs: 30 },
    { users: 250, durationSec: 10, thinkTimeMs: 40 },
    { users: 350, durationSec: 10, thinkTimeMs: 45 },
    { users: 400, durationSec: 10, thinkTimeMs: 50 },
    { users: 500, durationSec: 12, thinkTimeMs: 50 }
  ];

  const results = [];
  const allUsers = generateSyntheticUsers(550);

  for (const lvl of levels) {
    const stageUsers = allUsers.slice(0, lvl.users);
    const summary = await runLoadStage({
      name: `Graduated Load — ${lvl.users} Users`,
      users: stageUsers,
      durationSec: lvl.durationSec,
      thinkTimeMs: lvl.thinkTimeMs,
      baseUrl
    });

    // Breakdown status codes into 4xx, 5xx, 429
    let count4xx = 0, count5xx = 0, count429 = 0, countTimeouts = 0;
    for (const [code, cnt] of Object.entries(summary.statusCodes)) {
      const c = parseInt(code, 10);
      if (c === 429) count429 += cnt;
      else if (c >= 400 && c < 500) count4xx += cnt;
      else if (c >= 500) count5xx += cnt;
    }
    if (summary.errors?.TIMEOUT) countTimeouts = summary.errors.TIMEOUT;

    results.push({
      users: lvl.users,
      requests: summary.totalRequests,
      successful: summary.successfulRequests,
      failed: summary.failedRequests,
      exact_elapsed_seconds: summary.exact_elapsed_seconds,
      actual_RPS: summary.actual_RPS,
      p50: summary.p50,
      p90: summary.p90,
      p95: summary.p95,
      p99: summary.p99,
      max: summary.max,
      count5xx,
      count4xx,
      count429,
      timeouts: countTimeouts,
      errorRatePct: summary.errorRatePct
    });

    // Pause 1 second between stages to let connection pools settle
    await new Promise(r => setTimeout(r, 1000));
  }

  return results;
}
