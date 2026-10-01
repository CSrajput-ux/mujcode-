import { httpRequest } from '../lib/client.js';

export async function runRateLimitTest(baseUrl = 'http://127.0.0.1:5000') {
  console.log(`\n===============================================================`);
  console.log(`[TEST 17] RATE LIMITING TEST`);
  console.log(`===============================================================`);

  const results = {};
  const testIp = '192.168.100.42';

  console.log(`\n--- Test A: Burst Traffic from Single IP (Exceeding Window) ---`);
  // Window limit is 200 reqs/min. Send 220 requests rapidly from testIp.
  const burstCount = 220;
  const burstPromises = Array.from({ length: burstCount }, (_, i) =>
    httpRequest({
      baseUrl,
      path: '/api/university/faculties',
      headers: { 'X-Forwarded-For': testIp }
    })
  );

  const burstResponses = await Promise.all(burstPromises);
  const statusCounts = {};
  let sample429Headers = null;

  burstResponses.forEach((res) => {
    statusCounts[res.statusCode] = (statusCounts[res.statusCode] || 0) + 1;
    if (res.statusCode === 429 && !sample429Headers) {
      sample429Headers = {
        'x-ratelimit-limit': res.headers['x-ratelimit-limit'],
        'x-ratelimit-remaining': res.headers['x-ratelimit-remaining'],
        'retry-after': res.headers['retry-after'],
        body: res.data
      };
    }
  });

  console.log(`Burst Request Status Distribution (Target IP ${testIp}):`, statusCounts);
  console.log(`Sample 429 Response Headers:`, sample429Headers);

  results.burstTest = {
    totalSent: burstCount,
    statusCounts,
    rateLimitingEnforced: (statusCounts[429] || 0) > 0,
    sample429Headers
  };

  console.log(`\n--- Test B: Isolation Check (Does Throttling IP A affect IP B?) ---`);
  const isolatedIp = '192.168.100.99';
  const isoRes = await httpRequest({
    baseUrl,
    path: '/api/university/faculties',
    headers: { 'X-Forwarded-For': isolatedIp }
  });

  console.log(`Unthrottled IP ${isolatedIp} Status: ${isoRes.statusCode} (Expected 200 OK)`);
  results.isolationCheck = {
    isolatedIpStatus: isoRes.statusCode,
    isolationEffective: isoRes.statusCode === 200
  };

  return results;
}
