import { describe, it, beforeEach, after } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import {
  generateBase32Secret,
  base32Encode,
  base32Decode,
  generateTOTP,
  verifyTOTP,
  generateOtpAuthUri,
  generateBackupCodes,
  encryptMfaSecret,
  decryptMfaSecret
} from '../src/lib/totp.js';
import { AuthService } from '../src/services/AuthService.js';
import { signToken, signMfaPendingToken, verifyToken } from '../src/lib/auth.js';
import { requireAuth, requireAdmin } from '../src/lib/requireAuth.js';
import { terminateStorageWorker } from '../src/lib/storage.js';

describe('Admin Multi-Factor Authentication (MFA / TOTP) Comprehensive Suite', () => {

  // ─── 1. RFC 6238 Specification & Test Vectors ──────────────────────────────
  describe('RFC 6238 Standard Test Vectors', () => {
    const rfcSecret = Buffer.from('12345678901234567890', 'ascii');

    it('matches RFC 6238 Appendix B test vector at T=59s', () => {
      const code = generateTOTP(rfcSecret, 59, 30, 6);
      assert.strictEqual(code, '287082');
    });

    it('matches RFC 6238 Appendix B test vector at T=1111111109s', () => {
      const code = generateTOTP(rfcSecret, 1111111109, 30, 6);
      assert.strictEqual(code, '081804');
    });

    it('matches RFC 6238 Appendix B test vector at T=1234567890s', () => {
      const code = generateTOTP(rfcSecret, 1234567890, 30, 6);
      assert.strictEqual(code, '005924');
    });

    it('matches RFC 6238 Appendix B test vector at T=2000000000s', () => {
      const code = generateTOTP(rfcSecret, 2000000000, 30, 6);
      assert.strictEqual(code, '279037');
    });
  });

  // ─── 2. Base32 Codec & Key Derivation ──────────────────────────────────────
  describe('Base32 Codec & Random Secrets', () => {
    it('correctly encodes and decodes arbitrary binary buffers', () => {
      const original = crypto.randomBytes(32);
      const encoded = base32Encode(original);
      assert.strictEqual(typeof encoded, 'string');
      assert.ok(/^[A-Z2-7]+$/.test(encoded));

      const decoded = base32Decode(encoded);
      assert.strictEqual(Buffer.compare(original, decoded), 0);
    });

    it('generates 160-bit (20-byte) cryptographically secure Base32 secret', () => {
      const secret = generateBase32Secret(20);
      assert.strictEqual(typeof secret, 'string');
      assert.strictEqual(secret.length, 32); // 20 bytes * 8 / 5 = 32 base32 chars
      assert.ok(/^[A-Z2-7]{32}$/.test(secret));
    });

    it('throws error on invalid Base32 characters', () => {
      assert.throws(() => base32Decode('INVALID!189'), /Invalid Base32 character/);
    });
  });

  // ─── 3. Clock Skew & Window Tolerance ──────────────────────────────────────
  describe('TOTP Verification & Window Tolerance', () => {
    const secret = generateBase32Secret(20);
    const nowSec = 1700000000;

    it('accepts valid code generated at the exact current time step', () => {
      const code = generateTOTP(secret, nowSec);
      assert.strictEqual(verifyTOTP(code, secret, 1, 30, nowSec), true);
    });

    it('accepts code with 1 step clock lag (t - 30s)', () => {
      const code = generateTOTP(secret, nowSec - 30);
      assert.strictEqual(verifyTOTP(code, secret, 1, 30, nowSec), true);
    });

    it('accepts code with 1 step clock advance (t + 30s)', () => {
      const code = generateTOTP(secret, nowSec + 30);
      assert.strictEqual(verifyTOTP(code, secret, 1, 30, nowSec), true);
    });

    it('strictly rejects code beyond window (> 60s skew)', () => {
      const code = generateTOTP(secret, nowSec - 90);
      assert.strictEqual(verifyTOTP(code, secret, 1, 30, nowSec), false);
    });

    it('strictly rejects malformed or wrong-digit codes', () => {
      assert.strictEqual(verifyTOTP('12345', secret, 1, 30, nowSec), false);
      assert.strictEqual(verifyTOTP('1234567', secret, 1, 30, nowSec), false);
      assert.strictEqual(verifyTOTP('abcdef', secret, 1, 30, nowSec), false);
      assert.strictEqual(verifyTOTP(null, secret, 1, 30, nowSec), false);
    });
  });

  // ─── 4. Cryptographic Storage & AES-256-GCM Encryption ─────────────────────
  describe('AES-256-GCM Secret Encryption & Decryption', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const masterKey = 'test-encryption-key-for-admin-mfa-protection';

    it('encrypts secret into authenticated iv:tag:ciphertext payload', () => {
      const encrypted = encryptMfaSecret(secret, masterKey);
      const parts = encrypted.split(':');
      assert.strictEqual(parts.length, 3);
      assert.strictEqual(parts[0].length, 24); // 12-byte IV in hex
      assert.strictEqual(parts[1].length, 32); // 16-byte auth tag in hex
    });

    it('successfully decrypts with correct master key', () => {
      const encrypted = encryptMfaSecret(secret, masterKey);
      const decrypted = decryptMfaSecret(encrypted, masterKey);
      assert.strictEqual(decrypted, secret);
    });

    it('fails closed when attempting to decrypt with incorrect master key', () => {
      const encrypted = encryptMfaSecret(secret, masterKey);
      assert.throws(() => decryptMfaSecret(encrypted, 'wrong-key-will-fail-auth-tag'));
    });

    it('fails closed when ciphertext or auth tag is tampered with', () => {
      const encrypted = encryptMfaSecret(secret, masterKey);
      const parts = encrypted.split(':');
      parts[2] = 'ff' + parts[2].slice(2); // Tamper ciphertext
      assert.throws(() => decryptMfaSecret(parts.join(':'), masterKey));
    });
  });

  // ─── 5. OTP Auth URI & Backup Recovery Codes ───────────────────────────────
  describe('Enrollment Helpers: URI & Backup Codes', () => {
    it('generates valid otpauth:// URI containing issuer and user email', () => {
      const uri = generateOtpAuthUri({
        secret: 'TESTSECRET32CHARSLONGFORTESTING1',
        email: 'admin@muj.in',
        issuer: 'MujCode'
      });
      assert.ok(uri.startsWith('otpauth://totp/MujCode:admin%40muj.in?'));
      assert.ok(uri.includes('secret=TESTSECRET32CHARSLONGFORTESTING1'));
      assert.ok(uri.includes('issuer=MujCode'));
      assert.ok(uri.includes('digits=6'));
    });

    it('generates 8 single-use formatted backup recovery codes', () => {
      const codes = generateBackupCodes(8);
      assert.strictEqual(codes.length, 8);
      for (const code of codes) {
        assert.ok(/^[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(code));
      }
    });
  });

  // ─── 6. End-to-End AuthService Admin MFA Lifecycle ─────────────────────────
  describe('AuthService Admin MFA Workflow', () => {
    const adminPassword = 'AdminPassword@2026';
    let adminHashedPassword;

    let mockUsers;
    let mockContext;
    let authService;

    beforeEach(async () => {
      adminHashedPassword = await bcrypt.hash(adminPassword, 10);
      mockUsers = [
        {
          id: 'admin-1',
          name: 'Super Admin',
          email: 'admin@muj.in',
          role: 'admin',
          password: adminHashedPassword,
          isActive: true
        },
        {
          id: 'student-1',
          name: 'Jane Doe',
          email: 'student@muj.in',
          role: 'student',
          password: await bcrypt.hash('StudentPass@123', 10),
          isActive: true
        }
      ];

      mockContext = {
        getDb: () => ({ users: mockUsers }),
        saveDb: db => { mockUsers = db.users; }
      };

      authService = new AuthService(mockContext);
    });

    it('blocks non-admin users from initiating MFA setup', async () => {
      await assert.rejects(
        () => authService.setupAdminMfa('student-1'),
        err => err.status === 403 && /restricted to administrators/.test(err.message)
      );
    });

    it('initiates Admin MFA setup and returns secret, URI, and 8 backup codes', async () => {
      const setup = await authService.setupAdminMfa('admin-1');
      assert.strictEqual(typeof setup.secret, 'string');
      assert.ok(setup.otpAuthUri.includes('otpauth://totp/'));
      assert.strictEqual(setup.backupCodes.length, 8);
    });

    it('rejects verifyAndEnableAdminMfa if TOTP code is incorrect', async () => {
      await authService.setupAdminMfa('admin-1');
      await assert.rejects(
        () => authService.verifyAndEnableAdminMfa('admin-1', '000000'),
        err => err.status === 400 && /Invalid 6-digit TOTP code/.test(err.message)
      );
    });

    it('activates MFA when valid 6-digit code is submitted', async () => {
      const setup = await authService.setupAdminMfa('admin-1');
      const validCode = generateTOTP(setup.secret);

      const result = await authService.verifyAndEnableAdminMfa('admin-1', validCode);
      assert.strictEqual(result.success, true);

      const admin = mockUsers.find(u => u.id === 'admin-1');
      assert.strictEqual(admin.mfaEnabled, true);
      assert.ok(admin.mfaSecret && admin.mfaSecret.includes(':'));
      assert.strictEqual(admin.mfaBackupCodes.length, 8);
    });

    it('login flow returns mfaRequired and mfaToken when MFA is enabled', async () => {
      // 1. Setup & enable MFA
      const setup = await authService.setupAdminMfa('admin-1');
      const validCode = generateTOTP(setup.secret);
      await authService.verifyAndEnableAdminMfa('admin-1', validCode);

      // 2. Perform regular login
      const loginRes = await authService.login('admin@muj.in', adminPassword, 'admin');
      assert.strictEqual(loginRes.mfaRequired, true);
      assert.strictEqual(typeof loginRes.mfaToken, 'string');
      assert.strictEqual(loginRes.token, undefined); // Real token NOT yet issued!

      // 3. Verify mfaToken has type 'mfa_pending'
      const payload = verifyToken(null, loginRes.mfaToken);
      assert.strictEqual(payload.type, 'mfa_pending');
      assert.strictEqual(payload.role, 'admin');
    });

    it('requireAuth strictly blocks intermediate mfa_pending tokens', () => {
      const mfaPendingToken = signMfaPendingToken({
        id: 'admin-1',
        email: 'admin@muj.in',
        role: 'admin'
      });

      const payload = verifyToken(null, mfaPendingToken);
      const req = { user: payload };
      let respondedStatus = null;
      const res = {
        writeHead: status => { respondedStatus = status; },
        end: () => {}
      };

      const authorized = requireAuth(req, res);
      assert.strictEqual(authorized, false);
      assert.strictEqual(respondedStatus, 401);
    });

    it('verifyAdminMfaLogin issues authoritative session token on valid TOTP', async () => {
      const setup = await authService.setupAdminMfa('admin-1');
      const validCode = generateTOTP(setup.secret);
      await authService.verifyAndEnableAdminMfa('admin-1', validCode);

      const loginRes = await authService.login('admin@muj.in', adminPassword, 'admin');
      const currentTotp = generateTOTP(setup.secret);

      const mfaVerifyRes = await authService.verifyAdminMfaLogin(loginRes.mfaToken, currentTotp, null);
      assert.strictEqual(typeof mfaVerifyRes.token, 'string');
      assert.strictEqual(typeof mfaVerifyRes.refreshToken, 'string');
      assert.strictEqual(mfaVerifyRes.user.email, 'admin@muj.in');

      // Verify authoritative token has type 'access'
      const finalPayload = verifyToken(null, mfaVerifyRes.token);
      assert.strictEqual(finalPayload.type, 'access');
      assert.strictEqual(finalPayload.role, 'admin');
    });

    it('verifyAdminMfaLogin accepts single-use backup recovery code and consumes it', async () => {
      const setup = await authService.setupAdminMfa('admin-1');
      const validCode = generateTOTP(setup.secret);
      await authService.verifyAndEnableAdminMfa('admin-1', validCode);

      const loginRes = await authService.login('admin@muj.in', adminPassword, 'admin');
      const firstBackupCode = setup.backupCodes[0];

      // 1. Consume backup code
      const mfaVerifyRes = await authService.verifyAdminMfaLogin(loginRes.mfaToken, null, firstBackupCode);
      assert.strictEqual(typeof mfaVerifyRes.token, 'string');

      // 2. Verify code is marked used
      const admin = mockUsers.find(u => u.id === 'admin-1');
      const usedItem = admin.mfaBackupCodes.find(b => b.used === true);
      assert.ok(usedItem);

      // 3. Attempt to re-use same backup code must fail
      const loginRes2 = await authService.login('admin@muj.in', adminPassword, 'admin');
      await assert.rejects(
        () => authService.verifyAdminMfaLogin(loginRes2.mfaToken, null, firstBackupCode),
        err => err.status === 401 && /Invalid authentication code or recovery code/.test(err.message)
      );
    });

    it('disableAdminMfa disables 2FA with password and TOTP confirmation', async () => {
      const setup = await authService.setupAdminMfa('admin-1');
      const validCode = generateTOTP(setup.secret);
      await authService.verifyAndEnableAdminMfa('admin-1', validCode);

      // Disable with correct password and TOTP
      const currentTotp = generateTOTP(setup.secret);
      const disableRes = await authService.disableAdminMfa('admin-1', adminPassword, currentTotp);
      assert.strictEqual(disableRes.success, true);

      const admin = mockUsers.find(u => u.id === 'admin-1');
      assert.strictEqual(admin.mfaEnabled, false);
      assert.strictEqual(admin.mfaSecret, null);

      // Subsequent login is now single-step
      const loginRes = await authService.login('admin@muj.in', adminPassword, 'admin');
      assert.strictEqual(loginRes.mfaRequired, undefined);
      assert.strictEqual(typeof loginRes.token, 'string');
    });
  });

  after(async () => {
    await terminateStorageWorker();
  });
});
