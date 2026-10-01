import { httpRequest } from './lib/client.js';

async function testRateLimitBurst() {
  console.log('[RateLimit Verification] Firing 230 rapid requests from single IP 192.168.99.99...');
  const testIp = '192.168.99.99';

  const promises = Array.from({ length: 230 }, (_, i) =>
    httpRequest({
      baseUrl: 'http://127.0.0.1:5000',
      path: '/api/university/faculties',
      headers: { 'X-Forwarded-For': testIp }
    })
  );

  const responses = await Promise.all(promises);
  const statusCounts = {};
  for (const r of responses) {
    statusCounts[r.statusCode] = (statusCounts[r.statusCode] || 0) + 1;
  }
  console.log('[RateLimit Verification] Status codes received:', statusCounts);

  // Check health immediately after
  const healthRes = await httpRequest({
    baseUrl: 'http://127.0.0.1:5000',
    path: '/',
    headers: { 'X-Forwarded-For': '10.0.0.99' }
  });
  console.log('[RateLimit Verification] Root Health Status:', healthRes.statusCode, healthRes.data);

  if (statusCounts['429'] > 0 && healthRes.statusCode === 200) {
    console.log('✅ Rate limiter returned HTTP 429 correctly!');
    console.log('✅ System stayed completely healthy, workers did not crash!');
    process.exit(0);
  } else {
    console.error('❌ Rate limiter verification failed:', statusCounts);
    process.exit(1);
  }
}

testRateLimitBurst().catch(err => {
  console.error(err);
  process.exit(1);
});
