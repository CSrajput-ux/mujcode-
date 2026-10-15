# Admin Multi-Factor Authentication (MFA / TOTP) Enterprise Design

**Document Version:** 1.0.0  
**Priority:** P1 (Security Hardening Gate)  
**Status:** Approved Specification (Pending Implementation)  

---

## 1. Objective

Provide an enterprise-grade Two-Factor Authentication (2FA) mechanism using Time-based One-Time Passwords (RFC 6238 TOTP) to protect all administrator accounts and privileged system mutations in MujCode.

---

## 2. Technical Architecture & Cryptographic Standards

### 2.1 Algorithm & Library
- **Library:** Maintained implementation such as `otplib` or Node.js native `crypto.createHmac`.
- **Standard:** RFC 6238 TOTP with HMAC-SHA1 or HMAC-SHA256, 30-second time step, 6-digit passcode.
- **Clock Drift Tolerance:** Maximum 1 step (±30 seconds) window to prevent replay or clock skew lockouts.

### 2.2 Storage of MFA Secrets
- Secrets must **NEVER** be stored in plaintext.
- Secrets must be encrypted using AES-256-GCM using an encryption key derived from a dedicated `MFA_ENCRYPTION_KEY` environment variable.
- Secret payload schema:
  ```json
  {
    "mfaEnabled": true,
    "encryptedSecret": "iv:authTag:ciphertext",
    "backupCodes": [
      { "codeHash": "$2b$10$...", "used": false }
    ],
    "enabledAt": "2026-10-16T00:00:00Z"
  }
  ```

### 2.3 Enrollment Flow
1. Admin initiates MFA setup: `POST /api/auth/admin/mfa/setup`.
2. Server generates a cryptographically random Base32 secret (`crypto.randomBytes(20)`).
3. Server returns OTP Auth URI (`otpauth://totp/MujCode:admin@muj.in?secret=...&issuer=MujCode`) and QR code data URL.
4. Server generates 8 single-use 10-character alphanumeric **Recovery Codes**, stores their bcrypt hashes, and sends plaintext codes to admin **once**.
5. Admin confirms with a valid 6-digit token to complete enrollment.

### 2.4 Login Verification Flow
1. Normal `POST /api/auth/login` checks email and primary password.
2. If account has `mfaEnabled: true`, server generates a short-lived (5-minute) intermediate token with `type: 'mfa_pending'` and returns `{ mfaRequired: true, mfaToken }`.
3. Admin submits passcode: `POST /api/auth/admin/mfa/verify`.
4. Server validates intermediate token, checks TOTP or consumes an unused recovery code.
5. On success, issues authoritative `token` and `refreshToken` cookies with full `admin` role.

### 2.5 Security Controls & Anti-Abuse
- **Rate Limiting:** Maximum 5 invalid OTP attempts per 15-minute window; locks MFA verification upon threshold breach.
- **Zero Logging:** OTP tokens, plaintext secrets, and recovery codes must never appear in application logs or exception traces.
- **Step-up Authentication:** Sensitive administrative actions (e.g., bulk database wipe, faculty permission revocations, system configuration change) require re-entering the MFA token.
