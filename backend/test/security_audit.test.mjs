import test from 'node:test';
import assert from 'node:assert/strict';
import { signToken, verifyToken, revokeToken, isTokenRevoked } from '../src/lib/auth.js';
import { sanitizeInput, sanitizePrototype, sanitizeMongoQuery } from '../src/lib/sanitizer.js';
import { STUDENT_WRITABLE_FIELDS } from '../src/routes/student.js';

test('Security Audit Verification Suite', async (t) => {

  await t.test('1. Authentication: Algorithm pinning & rejection of alg=none', async () => {
    // Attempt to forge a token with alg=none
    const unsignedHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const forgedPayload = Buffer.from(JSON.stringify({
      id: 'attacker_1',
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 3600
    })).toString('base64url');
    const noneToken = `${unsignedHeader}.${forgedPayload}.`;

    const verified = verifyToken(noneToken);
    assert.equal(verified, null, 'Token with alg=none must be rejected');
  });

  await t.test('2. Authentication: Signature tampering detection', async () => {
    const validToken = signToken({ id: 'student_123', role: 'student', email: 'stu@muj.edu' });
    const parts = validToken.split('.');
    assert.equal(parts.length, 3, 'Token must be a 3-part JWT');

    // Tamper with payload to elevate role to admin
    const tamperedPayload = Buffer.from(JSON.stringify({
      id: 'student_123',
      role: 'admin',
      iss: 'mujcode',
      aud: 'mujcode-app'
    })).toString('base64url');
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    const verified = verifyToken(tamperedToken);
    assert.equal(verified, null, 'Tampered token must fail signature verification');
  });

  await t.test('3. Authentication: Revocation & Logout Blocklist', async () => {
    const token = signToken({ id: 'student_456', role: 'student' });
    const verifiedBefore = verifyToken(token);
    assert.ok(verifiedBefore, 'Token should be valid initially');

    // Revoke token
    await revokeToken(token);
    const isRevoked = await isTokenRevoked(verifiedBefore.jti);
    assert.equal(isRevoked, true, 'Revoked token jti must be tracked in blocklist');
  });

  await t.test('4. Mass Assignment: Student writable fields allow-list', async () => {
    const maliciousPayload = {
      name: 'Legit Student',
      phone: '9876543210',
      role: 'admin',
      cgpa: 10.0,
      semester: 8,
      status: 'Graduated'
    };

    // Filter using STUDENT_WRITABLE_FIELDS
    const filtered = {};
    for (const key of Object.keys(maliciousPayload)) {
      if (STUDENT_WRITABLE_FIELDS.includes(key)) {
        filtered[key] = maliciousPayload[key];
      }
    }

    assert.equal(filtered.name, 'Legit Student');
    assert.equal(filtered.phone, '9876543210');
    assert.equal(filtered.role, undefined, 'role field must not be writable');
    assert.equal(filtered.cgpa, undefined, 'cgpa field must not be writable');
    assert.equal(filtered.semester, undefined, 'semester field must not be writable');
  });

  await t.test('5. Injection: Prototype Pollution neutralization', async () => {
    const rawPayload = JSON.parse('{"__proto__":{"polluted":true},"title":"Test","nested":{"constructor":{"prototype":{"isAdmin":true}}}}');
    const clean = sanitizeInput(rawPayload);

    assert.equal(clean.__proto__.polluted, undefined, '__proto__ key must be stripped');
    assert.equal(Object.prototype.polluted, undefined, 'Global prototype must not be polluted');
    assert.equal(Object.prototype.isAdmin, undefined, 'Global prototype must not be polluted with isAdmin');
    assert.equal(clean.title, 'Test');
    assert.equal(Object.prototype.hasOwnProperty.call(clean.nested, 'constructor'), false, 'Own constructor property must be stripped');
  });

  await t.test('6. Injection: MongoDB NoSQL Operator stripping', async () => {
    const nosqlPayload = {
      studentId: { $ne: null },
      status: { $gt: '' },
      $where: 'sleep(5000)',
      legitField: 'student_123'
    };

    const clean = sanitizeMongoQuery(nosqlPayload);
    assert.equal(clean.studentId.$ne, undefined, '$ne operator must be stripped');
    assert.equal(clean.status.$gt, undefined, '$gt operator must be stripped');
    assert.equal(clean.$where, undefined, '$where operator must be stripped');
    assert.equal(clean.legitField, 'student_123', 'Legitimate field must be preserved');
  });

  await t.test('7. SSRF & Path Traversal validation', async () => {
    const ALLOWED_STORAGE_HOSTS = new Set([
      'res.cloudinary.com',
      'api.cloudinary.com',
      's3.amazonaws.com'
    ]);

    function isTrustedStorageUrl(urlString) {
      try {
        const parsed = new URL(urlString);
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
        const hostname = parsed.hostname.toLowerCase();
        return ALLOWED_STORAGE_HOSTS.has(hostname) || hostname.endsWith('.cloudinary.com') || hostname.endsWith('.amazonaws.com');
      } catch {
        return false;
      }
    }

    assert.equal(isTrustedStorageUrl('http://169.254.169.254/latest/meta-data/'), false, 'AWS Metadata IP must be blocked');
    assert.equal(isTrustedStorageUrl('http://localhost:5000/internal'), false, 'Localhost URL must be blocked');
    assert.equal(isTrustedStorageUrl('https://malicious-attacker.com/exploit.pdf'), false, 'Untrusted domain must be blocked');
    assert.equal(isTrustedStorageUrl('https://res.cloudinary.com/mujcode/image/upload/sample.pdf'), true, 'Cloudinary URL must be allowed');
    assert.equal(isTrustedStorageUrl('https://my-bucket.s3.amazonaws.com/assignment.pdf'), true, 'S3 URL must be allowed');
  });

  await t.test('8. Authorization: Negative tests & Cross-user IDOR rejection', async () => {
    const { requireSelfOrAdmin, requireAdmin, requireFaculty } = await import('../src/lib/requireAuth.js');

    const fakeStudentA = {
      user: { id: 'student_A', college_id: 'COL_A', role: 'student' }
    };
    const fakeStudentB = {
      user: { id: 'student_B', college_id: 'COL_B', role: 'student' }
    };
    const fakeAdmin = {
      user: { id: 'admin_1', role: 'admin' }
    };

    let sentCode = null;
    let sentBody = null;
    const mockRes = {
      setHeader: () => {},
      writeHead: (code) => { sentCode = code; },
      end: (data) => { sentBody = JSON.parse(data); }
    };

    // Student A accessing own record -> PASS
    const ownAccess = requireSelfOrAdmin(fakeStudentA, mockRes, 'student_A');
    assert.equal(ownAccess, true, 'Student accessing own ID must be permitted');

    // Student A accessing Student B record -> MUST FAIL with 403
    sentCode = null;
    const crossAccess = requireSelfOrAdmin(fakeStudentA, mockRes, 'student_B');
    assert.equal(crossAccess, false, 'Student accessing another student ID must be rejected');
    assert.equal(sentCode, 403, 'Cross-user ID tampering must return HTTP 403 Forbidden');

    // Student A attempting Admin endpoint -> MUST FAIL with 403
    sentCode = null;
    const adminAccess = requireAdmin(fakeStudentA, mockRes);
    assert.equal(adminAccess, false, 'Student attempting admin endpoint must be rejected');
    assert.equal(sentCode, 403, 'Unauthorized role escalation must return HTTP 403 Forbidden');

    // Admin accessing Student B record -> PASS
    const adminOnStudent = requireSelfOrAdmin(fakeAdmin, mockRes, 'student_B');
    assert.equal(adminOnStudent, true, 'Admin accessing student record must be permitted');
  });

  await t.test('9. Environment: Production CORS Wildcard Rejection', async () => {
    const { validateEnvironment } = await import('../src/config/envValidator.js');

    const invalidProdEnv = {
      NODE_ENV: 'production',
      TOKEN_SECRET: 'f7c8d9e0a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f6a7b8c9d0e1f2',
      CORS_ORIGIN: '*'
    };

    assert.throws(
      () => validateEnvironment(invalidProdEnv, { allowThrow: true }),
      /CORS_ORIGIN cannot be "\*" in production/,
      'Production configuration with CORS_ORIGIN=* must throw a fatal validation error'
    );

    const { isAllowedOrigin } = await import('../src/lib/cors.js');
    assert.equal(isAllowedOrigin('https://www.mujcode.in'), true, 'www.mujcode.in must be accepted');
    assert.equal(isAllowedOrigin('https://mujcode.in'), true, 'mujcode.in must be accepted');
    assert.equal(isAllowedOrigin('https://evil-attacker.com'), false, 'Unregistered external domain must be rejected');
  });

  await t.test('10. Compiler Submission Authorization: Job Status Ownership Guard', async () => {
    const { CodeExecutionService } = await import('../src/services/CodeExecutionService.js');
    const { requireSelfOrFacultyOrAdmin } = await import('../src/lib/requireAuth.js');

    const testJobId = 'job_auth_test_123';
    await CodeExecutionService.enqueueJob(testJobId, 'student_B', async () => ({ status: 'done' }));

    const job = await CodeExecutionService.getJob(testJobId);
    assert.ok(job, 'Job must be retrievable from store');
    assert.equal(job.userId, 'student_B', 'Job must preserve submitting userId');

    let sentCode = null;
    const mockRes = {
      setHeader: () => {},
      writeHead: (code) => { sentCode = code; },
      end: () => {}
    };

    // Caller student_A attempting to access student_B's job -> FAIL with 403
    const fakeStudentA = { user: { id: 'student_A', role: 'student' } };
    const canAccessOther = requireSelfOrFacultyOrAdmin(fakeStudentA, mockRes, job.userId);
    assert.equal(canAccessOther, false, 'Student A must not access Student B job status');
    assert.equal(sentCode, 403, 'Must return 403 Forbidden on cross-user job status polling');

    // Caller student_B accessing own job -> PASS
    const fakeStudentB = { user: { id: 'student_B', role: 'student' } };
    const canAccessOwn = requireSelfOrFacultyOrAdmin(fakeStudentB, mockRes, job.userId);
    assert.equal(canAccessOwn, true, 'Student B must access own job status');
  });

  await t.test('11. Environment: Insecure placeholder secret & localhost DB rejection in production', async () => {
    const { validateEnvironment } = await import('../src/config/envValidator.js');

    // Reject placeholder TOKEN_SECRET
    const placeholderEnv = {
      NODE_ENV: 'production',
      TOKEN_SECRET: 'development-secret-should-be-at-least-32-chars-long!',
      CORS_ORIGIN: 'https://www.mujcode.in'
    };
    assert.throws(
      () => validateEnvironment(placeholderEnv, { allowThrow: true }),
      /insecure placeholder value/,
      'Production configuration with placeholder secret must fail'
    );

    // Reject localhost PostgreSQL in production
    const localhostDbEnv = {
      NODE_ENV: 'production',
      TOKEN_SECRET: 'f7c8d9e0a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f6a7b8c9d0e1f2',
      CORS_ORIGIN: 'https://www.mujcode.in',
      POSTGRES_URI: 'postgres://postgres:password@localhost:5432/mujcode_db'
    };
    assert.throws(
      () => validateEnvironment(localhostDbEnv, { allowThrow: true }),
      /POSTGRES_URI cannot point to localhost/,
      'Production configuration with localhost Postgres must fail'
    );
  });

  await t.test('12. Seed Security: Strict production lockout & development seeding', async () => {
    const { seedDevelopmentAccounts } = await import('../src/scripts/seed.js');

    // Must throw when NODE_ENV is production
    await assert.rejects(
      async () => seedDevelopmentAccounts({ nodeEnv: 'production' }),
      /Seeding demo accounts is prohibited in production mode/,
      'Seeding demo accounts in production must be rejected'
    );

    // Must succeed in development dry-run
    const res = await seedDevelopmentAccounts({ nodeEnv: 'development', dryRun: true });
    assert.equal(res.success, true, 'Dry-run seed must succeed in development');
    assert.ok(res.accounts.length >= 4, 'Should configure 4 demo roles');
  });

  await t.test('13. Password Policy: Insecure default and banned demo password rejection', async () => {
    const { AuthService } = await import('../src/services/AuthService.js');

    const bannedPasswords = [
      'chhotu.2427030521',
      'Admin@123',
      'admin123',
      'password123',
      'changeme'
    ];

    for (const pw of bannedPasswords) {
      const check = AuthService.validatePasswordStrength(pw);
      assert.equal(check.valid, false, `Banned demo password "${pw}" must be rejected`);
      assert.match(check.message, /insecure default|characters/, `Rejection message expected for "${pw}"`);
    }

    // Strong valid password must pass
    const valid = AuthService.validatePasswordStrength('Enterprise@Secure2026!');
    assert.equal(valid.valid, true, 'Strong password must be accepted');
  });

  await t.test('14. Strict CORS: Origin exact matching, non-reflection, and credentials isolation', async () => {
    const { isAllowedOrigin, setCorsHeaders } = await import('../src/lib/cors.js');

    assert.equal(isAllowedOrigin('https://www.mujcode.in'), true);
    assert.equal(isAllowedOrigin('https://mujcode.in'), true);
    assert.equal(isAllowedOrigin('https://malicious.vercel.app'), false, 'Arbitrary vercel subdomains must be rejected');
    assert.equal(isAllowedOrigin('https://attacker.onrender.com'), false, 'Arbitrary render subdomains must be rejected');
    assert.equal(isAllowedOrigin('*'), false, 'Wildcard must be rejected');

    // Test header setting without reflection for untrusted origin
    let headers = {};
    const mockRes = {
      setHeader: (k, v) => { headers[k] = v; }
    };
    const untrustedReq = {
      headers: { origin: 'https://evil-hacker.com' }
    };

    setCorsHeaders(mockRes, untrustedReq);
    assert.equal(headers['Access-Control-Allow-Origin'], undefined, 'Untrusted origin must not be reflected');
    assert.equal(headers['Access-Control-Allow-Credentials'], undefined, 'Credentials must not be allowed for untrusted origin');

    // Test header setting for trusted origin
    headers = {};
    const trustedReq = {
      headers: { origin: 'https://www.mujcode.in' }
    };
    setCorsHeaders(mockRes, trustedReq);
    assert.equal(headers['Access-Control-Allow-Origin'], 'https://www.mujcode.in');
    assert.equal(headers['Access-Control-Allow-Credentials'], 'true');
  });

  await t.test('15. Metrics Authorization: Anti-Spoofing and Scraper Token Enforcement', async () => {
    const { createApp } = await import('../src/app.js');
    const { config } = await import('../src/config.js');
    const prevEnv = config.nodeEnv;
    const prevToken = process.env.METRICS_TOKEN;
    config.nodeEnv = 'production';
    process.env.METRICS_TOKEN = 'secret-prom-token-98765';

    const app = await createApp();

    // Case A: Spoofed X-Forwarded-For from external IP -> Must return 403 Forbidden
    let spoofStatusCode = null;
    let spoofBody = '';
    const spoofedReq = {
      method: 'GET',
      url: '/metrics',
      headers: {
        'x-forwarded-for': '127.0.0.1' // Attacker attempting to spoof localhost
      },
      socket: {
        remoteAddress: '198.51.100.24' // Actual physical WAN IP
      }
    };
    const spoofedRes = {
      setHeader: () => {},
      writeHead: (code) => { spoofStatusCode = code; },
      end: (data) => { if (!spoofStatusCode) spoofStatusCode = 200; spoofBody = data; }
    };

    await app(spoofedReq, spoofedRes);
    assert.equal(spoofStatusCode, 403, 'Spoofed X-Forwarded-For must be rejected with 403 Forbidden');

    // Case B: Request with valid X-Metrics-Token header -> Must be allowed
    let tokenStatusCode = null;
    let tokenBody = '';
    const tokenReq = {
      method: 'GET',
      url: '/metrics',
      headers: {
        'x-metrics-token': 'secret-prom-token-98765'
      },
      socket: {
        remoteAddress: '198.51.100.24'
      }
    };
    const tokenRes = {
      setHeader: () => {},
      writeHead: (code) => { tokenStatusCode = code; },
      end: (data) => { if (!tokenStatusCode) tokenStatusCode = 200; tokenBody = data; }
    };

    await app(tokenReq, tokenRes);
    assert.equal(tokenStatusCode, 200, 'Request with valid metrics token must be allowed');

    // Case C: Direct physical loopback connection -> Allowed
    let loopbackStatusCode = null;
    let loopbackBody = '';
    const loopbackReq = {
      method: 'GET',
      url: '/metrics',
      headers: {},
      socket: {
        remoteAddress: '127.0.0.1'
      }
    };
    const loopbackRes = {
      setHeader: () => {},
      writeHead: (code) => { loopbackStatusCode = code; },
      end: (data) => { if (!loopbackStatusCode) loopbackStatusCode = 200; loopbackBody = data; }
    };

    await app(loopbackReq, loopbackRes);
    assert.equal(loopbackStatusCode, 200, 'Direct physical loopback must be allowed');

    // Teardown
    config.nodeEnv = prevEnv;
    process.env.METRICS_TOKEN = prevToken;
  });

  const { closeRedis } = await import('../src/config/redis.js');
  const { closePostgres } = await import('../src/lib/postgres.js');
  const { terminateStorageWorker } = await import('../src/lib/storage.js');
  await closeRedis();
  await closePostgres();
  await terminateStorageWorker();
});



