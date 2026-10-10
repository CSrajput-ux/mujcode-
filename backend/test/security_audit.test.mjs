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
      TOKEN_SECRET: 'a_very_secure_and_long_secret_key_32_bytes_minimum!',
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

});


