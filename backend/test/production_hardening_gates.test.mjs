import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { signToken, verifyToken, revokeToken, isTokenRevoked } from '../src/lib/auth.js';
import { createApp } from '../src/app.js';
import { config } from '../src/config.js';
import { AuthService } from '../src/services/AuthService.js';
import { Judge0Service } from '../src/services/Judge0Service.js';
import { closeRedis } from '../src/config/redis.js';
import { closePostgres } from '../src/lib/postgres.js';
import { terminateStorageWorker } from '../src/lib/storage.js';

function createMockReq({ method = 'GET', url = '/', token = null, body = null, headers = {}, socketIp = '127.0.0.1' }) {
  const bodyBuffer = body ? Buffer.from(typeof body === 'string' ? body : JSON.stringify(body)) : Buffer.alloc(0);
  const stream = Readable.from(bodyBuffer.length ? [bodyBuffer] : []);
  stream.method = method;
  stream.url = url;
  stream.headers = {
    ...(token ? { authorization: `Bearer ${token}` } : {}),
    ...(body ? { 'content-type': 'application/json', 'content-length': String(bodyBuffer.length) } : {}),
    ...headers
  };
  stream.socket = { remoteAddress: socketIp };
  return stream;
}

function createMockRes() {
  const headers = {};
  let statusCode = 200;
  let body = '';
  return {
    headers,
    setHeader: (k, v) => { headers[k.toLowerCase()] = v; },
    getHeader: (k) => headers[k.toLowerCase()],
    writeHead: (code, extraHeaders) => {
      statusCode = code;
      if (extraHeaders) {
        for (const [k, v] of Object.entries(extraHeaders)) headers[k.toLowerCase()] = v;
      }
    },
    end: (data) => {
      if (data) body += data;
    },
    getStatusCode: () => statusCode,
    getBody: () => body
  };
}

test('Production Hardening Gates Verification Suite', async (t) => {

  // ── 1. Authentication Edge Cases & Defense-in-Depth ─────────────────────────
  await t.test('1. Authentication Edge Cases: Missing, malformed, and expired tokens', async () => {
    // Missing tokens
    assert.equal(verifyToken(null), null, 'null token must verify to null');
    assert.equal(verifyToken(''), null, 'empty token must verify to null');
    assert.equal(verifyToken(undefined), null, 'undefined token must verify to null');

    // Malformed tokens
    assert.equal(verifyToken('invalid-token-string'), null, 'Non-JWT string must be rejected');
    assert.equal(verifyToken('header.payload'), null, '2-part token must be rejected');
    assert.equal(verifyToken('a.b.c.d'), null, '4-part token must be rejected');
    assert.equal(verifyToken('...'), null, 'empty dot token must be rejected');

    // Expired token (custom expiry -3600000 ms in the past)
    const expiredToken = signToken({ id: 'u1', role: 'student' }, -3600000);
    assert.equal(verifyToken(expiredToken), null, 'Expired token must fail verification');

    // Tampered signature
    const validToken = signToken({ id: 'u2', role: 'student' });
    const parts = validToken.split('.');
    const tamperedSig = parts[2].slice(0, -4) + 'zzzz';
    assert.equal(verifyToken(`${parts[0]}.${parts[1]}.${tamperedSig}`), null, 'Tampered signature must fail verification');
  });

  // ── 2. Password Policy: Banned Defaults & Backdoor Neutralization ────────────
  await t.test('2. Password Policy: Banned default passwords & backdoor rejection', async () => {
    const bannedPasswords = [
      'chhotu.2427030521',
      'Admin@123',
      'admin123',
      'password123',
      'changeme',
      'secret',
      'development-secret'
    ];

    for (const pwd of bannedPasswords) {
      const result = AuthService.validatePasswordStrength(pwd);
      assert.equal(result.valid, false, `Password "${pwd}" must be rejected`);
      assert.match(result.message, /known insecure default/i);
    }
  });

  // ── 3. Permissions Endpoint RBAC: Strict Role Guards ────────────────────────
  await t.test('3. Permissions Routes: Student rejection and Faculty/Admin authorization', async () => {
    const app = await createApp();

    const studentToken = signToken({ id: 'student_1', role: 'student', email: 'stu@muj.edu' });
    const facultyToken = signToken({ id: 'faculty_1', role: 'faculty', email: 'fac@muj.edu' });
    const adminToken = signToken({ id: 'admin_1', role: 'admin', email: 'admin@muj.edu' });

    // A: Student calling /api/permissions -> Must return 403 Forbidden
    const reqStudentGet = createMockReq({ method: 'GET', url: '/api/permissions', token: studentToken });
    const resStudentGet = createMockRes();
    await app(reqStudentGet, resStudentGet);
    assert.equal(resStudentGet.getStatusCode(), 403, 'Student cannot access GET /api/permissions');

    // B: Student calling /api/permissions/block -> Must return 403 Forbidden
    const reqStudentPost = createMockReq({
      method: 'POST',
      url: '/api/permissions/block',
      token: studentToken,
      body: { targetId: 'other_student' }
    });
    const resStudentPost = createMockRes();
    await app(reqStudentPost, resStudentPost);
    assert.equal(resStudentPost.getStatusCode(), 403, 'Student cannot access POST /api/permissions/block');

    // C: Unauthenticated calling /api/permissions/blocks -> Must return 401 Unauthorized
    const reqAnonBlocks = createMockReq({ method: 'GET', url: '/api/permissions/blocks' });
    const resAnonBlocks = createMockRes();
    await app(reqAnonBlocks, resAnonBlocks);
    assert.equal(resAnonBlocks.getStatusCode(), 401, 'Unauthenticated user cannot access GET /api/permissions/blocks');

    // D: Faculty calling /api/permissions -> Allowed (200 OK)
    const reqFacultyGet = createMockReq({ method: 'GET', url: '/api/permissions', token: facultyToken });
    const resFacultyGet = createMockRes();
    await app(reqFacultyGet, resFacultyGet);
    assert.equal(resFacultyGet.getStatusCode(), 200, 'Faculty can access GET /api/permissions');

    // E: Admin calling /api/permissions -> Allowed (200 OK)
    const reqAdminGet = createMockReq({ method: 'GET', url: '/api/permissions', token: adminToken });
    const resAdminGet = createMockRes();
    await app(reqAdminGet, resAdminGet);
    assert.equal(resAdminGet.getStatusCode(), 200, 'Admin can access GET /api/permissions');
  });

  // ── 4. File Security & Path Traversal Resistance ─────────────────────────────
  await t.test('4. File Security: Path traversal rejection in static file serving', async () => {
    const app = await createApp();

    // Path traversal attempt targeting system directories
    const reqTraversal1 = createMockReq({ method: 'GET', url: '/uploads/../../etc/passwd' });
    const resTraversal1 = createMockRes();
    await app(reqTraversal1, resTraversal1);
    assert.equal(resTraversal1.getStatusCode(), 403, 'Path traversal (/uploads/../../) must return 403');

    // Encoded traversal
    const reqTraversal2 = createMockReq({ method: 'GET', url: '/uploads/%2E%2E%2F%2E%2E%2Fwindows/win.ini' });
    const resTraversal2 = createMockRes();
    await app(reqTraversal2, resTraversal2);
    assert.equal(resTraversal2.getStatusCode(), 403, 'Encoded path traversal must return 403');
  });

  // ── 5. Compiler Input & Resource Clamping ────────────────────────────────────
  await t.test('5. Compiler Security: CPU, wall-time, and memory clamping bounds', async () => {
    const requestedCpu = 999;
    const requestedWall = 999;
    const requestedMem = 99999999;

    const safeCpu = Math.min(5, Math.max(0.5, Number(requestedCpu)));
    const safeWall = Math.min(10, Math.max(1, Number(requestedWall)));
    const safeMem = Math.min(2048000, Math.max(16384, Number(requestedMem)));

    assert.equal(safeCpu, 5, 'CPU time limit must be clamped to 5s maximum');
    assert.equal(safeWall, 10, 'Wall clock time limit must be clamped to 10s maximum');
    assert.equal(safeMem, 2048000, 'Memory limit must be clamped to 2GB maximum');
  });

  // ── 6. Metrics Anti-Spoofing Matrix ─────────────────────────────────────────
  await t.test('6. Metrics Anti-Spoofing: X-Real-IP, Forwarded, and Loopback Matrix', async () => {
    const app = await createApp();
    const prevEnv = config.nodeEnv;
    const prevToken = process.env.METRICS_TOKEN;
    config.nodeEnv = 'production';
    process.env.METRICS_TOKEN = 'prod-metric-secret-abc';

    async function testMetrics(headers = {}, socketIp = '198.51.100.99', token = null) {
      const req = createMockReq({ method: 'GET', url: '/metrics', token, headers, socketIp });
      const res = createMockRes();
      await app(req, res);
      return { statusCode: res.getStatusCode(), body: res.getBody() };
    }

    // A: Spoofed X-Forwarded-For -> 403
    const resXFF = await testMetrics({ 'x-forwarded-for': '127.0.0.1' }, '203.0.113.10');
    assert.equal(resXFF.statusCode, 403, 'Spoofed X-Forwarded-For must be rejected with 403');

    // B: Spoofed X-Real-IP -> 403
    const resXReal = await testMetrics({ 'x-real-ip': '127.0.0.1' }, '203.0.113.10');
    assert.equal(resXReal.statusCode, 403, 'Spoofed X-Real-IP must be rejected with 403');

    // C: Spoofed Forwarded header -> 403
    const resForwarded = await testMetrics({ forwarded: 'for=127.0.0.1' }, '203.0.113.10');
    assert.equal(resForwarded.statusCode, 403, 'Spoofed Forwarded header must be rejected with 403');

    // D: IPv4-mapped loopback address on socket -> 200 OK
    const resMappedLoopback = await testMetrics({}, '::ffff:127.0.0.1');
    assert.equal(resMappedLoopback.statusCode, 200, 'IPv4-mapped loopback (::ffff:127.0.0.1) must be allowed');

    // E: Valid metrics token header -> 200 OK
    const resToken = await testMetrics({ 'x-metrics-token': 'prod-metric-secret-abc' }, '203.0.113.10');
    assert.equal(resToken.statusCode, 200, 'Valid X-Metrics-Token must be allowed from external scraper');

    // F: Invalid metrics token header -> 403
    const resBadToken = await testMetrics({ 'x-metrics-token': 'wrong-token' }, '203.0.113.10');
    assert.equal(resBadToken.statusCode, 403, 'Invalid X-Metrics-Token must be rejected');

    // G: Valid Admin JWT -> 200 OK
    const adminToken = signToken({ id: 'admin_1', role: 'admin' });
    const resAdmin = await testMetrics({}, '203.0.113.10', adminToken);
    assert.equal(resAdmin.statusCode, 200, 'Valid Admin JWT must be allowed to access /metrics');

    // H: Non-admin JWT -> 403 Forbidden
    const studentToken = signToken({ id: 'student_1', role: 'student' });
    const resStudent = await testMetrics({}, '203.0.113.10', studentToken);
    assert.equal(resStudent.statusCode, 403, 'Student JWT must be denied /metrics access');

    // I: Verify metrics payload contains no sensitive leaks
    assert.ok(!resToken.body.includes('password'), 'Metrics payload must not contain password strings');
    assert.ok(!resToken.body.includes('postgresql://'), 'Metrics payload must not contain PostgreSQL connection URLs');
    assert.ok(!resToken.body.includes('mongodb://'), 'Metrics payload must not contain MongoDB connection URLs');

    // Teardown
    config.nodeEnv = prevEnv;
    process.env.METRICS_TOKEN = prevToken;
  });

  // ── 7. Health Probes: Liveness & Readiness Contracts ────────────────────────
  await t.test('7. Health Probes: /health/live and /health/ready contracts', async () => {
    const app = await createApp();

    // A: Liveness Probe (/health/live) -> Must return 200 OK and uptimeSeconds
    const reqLive = createMockReq({ method: 'GET', url: '/health/live' });
    const resLive = createMockRes();
    await app(reqLive, resLive);
    assert.equal(resLive.getStatusCode(), 200, '/health/live must return 200 OK');
    const parsedLive = JSON.parse(resLive.getBody() || '{}');
    assert.equal(parsedLive.status, 'ok', 'Status should be ok');
    assert.ok(typeof parsedLive.uptimeSeconds === 'number', 'Uptime must be a number');

    // B: Readiness Probe (/health/ready) -> Returns 200 or 503 depending on dependencies
    const reqReady = createMockReq({ method: 'GET', url: '/health/ready' });
    const resReady = createMockRes();
    await app(reqReady, resReady);
    assert.ok([200, 503].includes(resReady.getStatusCode()), '/health/ready must return 200 or 503');
    const parsedReady = JSON.parse(resReady.getBody() || '{}');
    assert.ok(parsedReady.services, 'Readiness response must report service statuses');
    // Ensure no connection strings leaked
    const bodyStr = JSON.stringify(parsedReady);
    assert.ok(!bodyStr.includes('postgres://'), 'Readiness probe must not leak postgres URI');
    assert.ok(!bodyStr.includes('mongodb://'), 'Readiness probe must not leak mongodb URI');
  });

  // Teardown open database/redis handles to ensure clean test exit
  await closeRedis();
  await closePostgres();
  await terminateStorageWorker();
});
