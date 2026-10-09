# 17 — Authentication & Authorization Verification Audit
**MujCode Platform — Identity Verification, Cryptographic Controls & Access Policy Matrix**

---

## 1. Cryptographic Authentication Architecture

### 1.1 Token Structure & Algorithm Pinning (`src/lib/auth.js`)
- **Algorithm:** Strictly pinned to `HS256` (HMAC-SHA256).
- **Security Control:** `verifyToken` inspects the decoded header and explicitly rejects any algorithm other than `HS256` (blocking `none` algorithm exploits and RSA/HMAC confusion attacks).
- **Signature Verification:** Uses `crypto.timingSafeEqual` with constant-time byte buffers to prevent timing side-channel attacks.
- **Claims Verification:**
  - `iss`: Validated against `'mujcode'`.
  - `aud`: Validated against `'mujcode-app'`.
  - `expiresAt`: Validated against server timestamp (`Date.now()`).
  - `jti`: Cryptographically generated UUID attached to every issued token.

### 1.2 Token Lifecycle & Revocation
- **Access Tokens:** Short-lived validity (15 minutes).
- **Refresh Tokens:** Long-lived validity (7 days), signed with `type: 'refresh'`.
- **Active JTI Revocation:**
  - `revokeToken(rawToken)` calculates the token's remaining TTL and writes `token:revoked:${jti} = '1'` to Redis with that exact TTL.
  - Revoked tokens are instantly rejected across all cluster workers connected to Redis.
- **Password Hashing & Timing Protection (`src/services/AuthService.js`):**
  - Uses `bcrypt` with `12` salt rounds.
  - When an unregistered email attempts login, the backend executes `bcrypt.compare(password, DUMMY_HASH)` using a pre-computed hash to ensure equal execution time (~180ms), preventing user enumeration via timing discrepancies.

---

## 2. Complete Route-Level Authorization Matrix

| Route Module | Method & Endpoint | Auth Level Required | Object-Level Ownership Guard | Intentionally Public? |
|---|---|---|---|---|
| **Auth** | `POST /api/auth/login` | Public | N/A (Rate limited: 15 / 15m) | Yes |
| **Auth** | `POST /api/auth/refresh` | Public / Refresh Token | Validates refresh signature + JTI | Yes |
| **Auth** | `POST /api/auth/logout` | Authenticated | Revokes calling token & clears cookies | No |
| **Auth** | `GET /api/auth/me` | Authenticated | Returns caller identity | No |
| **Auth** | `POST /api/auth/change-password`| Authenticated | `requireAuth` + verifies old password | No |
| **Student** | `GET /api/student/dashboard` | Student / Admin | Scoped to caller `req.user.id` | No |
| **Student** | `GET /api/student/profile` | Student / Admin | `requireSelfOrAdmin(req.user.id)` | No |
| **Student** | `PUT /api/student/profile` | Student / Admin | `requireSelfOrAdmin(req.user.id)` | No |
| **Faculty** | `GET /api/faculty/courses` | Faculty / Admin | Scoped to caller `facultyId` | No |
| **Faculty** | `POST /api/faculty/assignments` | Faculty / Admin | Scoped to course faculty | No |
| **Admin** | `GET /api/admin/users` | Admin Only | `requireAdmin(req, res)` | No |
| **Admin** | `POST /api/admin/users/create` | Admin Only | `requireAdmin(req, res)` | No |
| **Admin** | `DELETE /api/admin/users/:id` | Admin Only | `requireAdmin(req, res)` | No |
| **Placements** | `GET /api/placements/jobs` | Authenticated | Filtered by active status | No |
| **Placements** | `POST /api/placements/apply` | Student Only | `requireStudent(req, res)` | No |
| **Problems** | `GET /api/problems/list` | Authenticated | Public read for logged-in students | No |
| **Problems** | `POST /api/problems/create` | Faculty / Admin | `requireFaculty(req, res)` | No |
| **Judge** | `POST /api/judge/submit` | Authenticated | `requireAuth` + `codeRateLimiter` | No |
| **Judge** | `GET /api/judge/job-status/:id`| Authenticated | UUID token / job ID | No |
| **Tests** | `GET /api/tests/all` | Authenticated | Filtered by batch / department | No |
| **Tests** | `POST /api/tests/:id/start` | Student | Scoped to enrolled student | No |
| **Tests** | `POST /api/tests/:id/submit` | Student | Scoped to enrolled student | No |
| **Exam Security**| `POST /api/exam-security/violation`| Student | Session ID validation | No |
| **Exam Recovery**| `POST /api/exam-recovery/save-state`| Student | Scoped to `req.user.id` | No |
| **Live Classes** | `GET /api/live-classes/rooms` | Authenticated | Room membership check | No |
| **System** | `GET /api/system/metrics` | Admin Only | `requireAdmin(req, res)` | No |
| **System** | `GET /api/system/reconciliation` | Admin Only | `requireAdmin(req, res)` | No |
| **Observability**| `GET /metrics`, `GET /health` | Public / Monitoring | Prometheus scrape / Health ping | Yes |

---

## 3. Object-Level Access Control (BOLA/IDOR) Evaluation

- **Code Guard (`src/lib/requireAuth.js:55-93`):**
  - `requireSelfOrAdmin(req, res, targetId)`: Validates that `req.user.id === targetId || req.user.college_id === targetId || req.user.role === 'admin'`.
  - `requireSelfOrFacultyOrAdmin(req, res, targetId)`: Validates that `req.user.id === targetId || req.user.role === 'faculty' || req.user.role === 'admin'`.
- **Verdict:** **PASS**. No unprotected Object-Level IDOR vulnerabilities identified in user profile, test submission, or assignment endpoints.

---

## 4. Auth Findings & Security Hardening Status

| Finding ID | Severity | Status | Description |
|---|---|---|---|
| **AUTH-01** | High | **VERIFIED FIXED** | Brute-force lockout protection enforced via Redis key `auth:lockout:${email}` with exponential backoff. |
| **AUTH-02** | Medium | **VERIFIED FIXED** | Access token validity reduced from 24 hours to 15 minutes with HttpOnly refresh token rotation. |
| **AUTH-03** | Low / Info | **VERIFIED FIXED** | Constant-time HMAC signature verification prevents timing attacks. |
