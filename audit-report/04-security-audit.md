# 04 — Security Audit
**MujCode Platform — Security Assessment**

---

## Assessment Scope
- Backend API endpoints (18 route modules)
- Authentication and authorization system
- Frontend security controls
- Dependency vulnerabilities
- Compiler sandbox isolation
- Transport security

---

## Finding Index

| ID | Component | Severity | Status |
|----|-----------|----------|--------|
| SEC-01 | CORS_ORIGIN=* in .env | CRITICAL | FAIL |
| SEC-02 | @tiptap/core XSS (GHSA-cp6q-959q-f8rh) | HIGH | FAIL |
| SEC-03 | TensorFlow.js chain vuln (argparse) | HIGH | FAIL |
| SEC-04 | face-api.js -> tfjs-core node-fetch | LOW | FAIL |
| SEC-05 | JWT algorithm pinning | - | PASS |
| SEC-06 | Timing-safe token comparison | - | PASS |
| SEC-07 | Token revocation / blocklist | - | PASS |
| SEC-08 | Brute-force protection | - | PASS |
| SEC-09 | Prototype pollution prevention | - | PASS |
| SEC-10 | SQL injection (parameterized) | - | PASS |
| SEC-11 | Path traversal in /uploads | - | PASS |
| SEC-12 | IDOR on judge submissions | MEDIUM | PARTIAL |
| SEC-13 | Hardcoded judge0 secrets | MEDIUM | FAIL |
| SEC-14 | Metrics endpoint public | LOW | INFORMATIONAL |
| SEC-15 | httpOnly cookie flag | MEDIUM | NOT TESTED |
| SEC-16 | CSP on frontend nginx | MEDIUM | FAIL |

---

## CRITICAL Findings

### SEC-01: CORS_ORIGIN=* in production .env
- Severity: CRITICAL
- Confidence: HIGH (evidence: .env line 16)
- File: .env line 16
- Evidence:
  ```
  CORS_ORIGIN=*
  ```
- Impact: Any malicious website can make credentialed API requests on behalf of logged-in users (CSRF-equivalent)
- Note: envValidator.js at line 86 correctly REJECTS `*` in production:
  ```js
  if (validated.NODE_ENV === 'production' && validated.CORS_ORIGIN === '*') {
    process.exit(1);
  }
  ```
  However, since NODE_ENV=production IS set and CORS_ORIGIN=*, the backend should be **refusing to start**. This may indicate the backend is currently running in development mode OR the validator bypass is occurring.
- Fix: `CORS_ORIGIN=https://your-vercel-app.vercel.app`
- Regression Test: Attempt CORS preflight from evil.example.com — must receive 403/no ACAO header

---

## HIGH Findings

### SEC-02: @tiptap/core XSS + Prototype Pollution
- Severity: HIGH
- CVE: GHSA-cp6q-959q-f8rh
- CWE: CWE-79, CWE-1321
- Affected: @tiptap/core >=2.0.0-alpha.0 <3.30.4
- Currently installed: 2.26.1
- Impact: An attacker who can inject content into TipTap (content editor used in assignment/question creation) can inject executable DOM attributes via `__proto__` key in mergeAttributes()
- Affected Users: Faculty and admin users who create course content
- Fix: `npm install @tiptap/core@>=3.30.4`
- Regression: Render TipTap with input containing `{"__proto__": {"onload": "alert(1)"}}` and verify no execution

### SEC-03: TensorFlow.js argparse chain vulnerability
- Severity: HIGH (inherited)
- Affected: @tensorflow/tfjs >=2.2.0
- Impact: argparse dependency has a known vulnerability affecting TF.js used for exam proctoring
- Fix: Evaluate if TensorFlow.js can be replaced with a lighter model-loading library for face detection

---

## MEDIUM Findings

### SEC-12: IDOR on Submission Endpoint
- Severity: MEDIUM
- Confidence: MEDIUM
- File: src/routes/judge.js line 230-245
- Code:
  ```js
  router.get('/api/judge/submissions/:userId/:problemNumber', async (req, res) => {
    if (!requireSelfOrFacultyOrAdmin(req, res, req.params.userId)) return;
    ...
  ```
- The `requireSelfOrFacultyOrAdmin` check is correct here. However, other routes in student.js and tests.js need individual audit to confirm all use ownership checks.
- Fix: Audit every route that takes a userId parameter to confirm ownership check is applied

### SEC-13: Hardcoded Secrets in judge0.conf
- Severity: MEDIUM
- File: judge0/judge0.conf
- Evidence (REDACTED):
  ```
  POSTGRES_PASSWORD=[REDACTED]
  REDIS_PASSWORD=[REDACTED]
  ```
- File is in .gitignore — not committed. Risk is accidental commit or shared local machine access.
- Fix: Use Docker secrets or ENV vars referenced from .env file

### SEC-15: HttpOnly Cookie Flag — NOT TESTED
- Status: NOT TESTED
- Cannot determine token storage mechanism on frontend without runtime inspection
- Risk: If JWT stored in localStorage, XSS can steal tokens
- Recommendation: Verify token is stored in HttpOnly cookie or use secure alternatives

### SEC-16: CSP Missing from Frontend nginx.conf
- Severity: MEDIUM
- File: frontend/nginx.conf
- Content-Security-Policy header is not set in frontend nginx config
- The backend sets CSP for API responses but the frontend nginx serving static assets does not
- Fix: Add CSP header to frontend/nginx.conf server block:
  ```nginx
  add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' wss: https:;";
  ```

---

## LOW / Informational

### SEC-14: /metrics Endpoint is Public
- Severity: INFORMATIONAL
- The Prometheus /metrics endpoint is public (no auth required)
- Exposes: memory usage, heap stats, request counts, route-level latency
- Risk: Information disclosure to attacker doing reconnaissance
- Fix: Add IP allowlist or basic auth to /metrics in nginx.conf

---

## PASSING Security Controls

### SEC-05: JWT Algorithm Pinning — PASS
- Evidence: auth.js line 229
  ```js
  if (!header || header.alg !== 'HS256') { return null; }
  ```
- Rejects 'none', RSA, ECDSA algorithms

### SEC-06: Timing-Safe Token Comparison — PASS
- Evidence: auth.js line 243
  ```js
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) { return null; }
  ```

### SEC-07: Token Revocation — PASS
- JTI-based blocklist in Redis with TTL
- In-memory fallback for Redis outage
- Test: node --test test/security_audit.test.mjs — PASS (3. Authentication: Revocation & Logout Blocklist)

### SEC-08: Brute-Force Protection — PASS
- 5 failed attempts → 15-min lockout per email+IP combo
- Redis-backed with atomic INCR + EXPIRE

### SEC-09: Prototype Pollution — PASS
- Evidence: app.js line 168
  ```js
  if (key === '__proto__' || key === 'constructor' || key === 'prototype' || key.startsWith('$')) { continue; }
  ```
- Test result: PASS (5. Injection: Prototype Pollution neutralization)

### SEC-10: SQL Injection — PASS
- All pg queries use parameterized $1, $2 placeholders
- No string concatenation in SQL queries found

### SEC-11: Path Traversal — PASS
- Evidence: app.js line 116
  ```js
  if (!filePath.startsWith(config.uploadDir)) { return sendJson(res, 403, { error: 'Forbidden' }); }
  ```
- Test: PASS (7. SSRF & Path Traversal validation)

---

## OWASP Top 10 Assessment

| Risk | Status | Notes |
|------|--------|-------|
| A01 Broken Access Control | PARTIAL | IDOR partial risk on some endpoints |
| A02 Cryptographic Failures | PASS | HS256 with timing-safe comparison |
| A03 Injection | PASS | Parameterized queries, prototype pollution blocked |
| A04 Insecure Design | PARTIAL | db.json fallback creates dual-truth risk |
| A05 Security Misconfiguration | FAIL | CORS_ORIGIN=* is blocking issue |
| A06 Vulnerable Components | FAIL | 3 HIGH frontend vulnerabilities |
| A07 Auth Failures | PASS | Strong JWT + brute-force protection |
| A08 Integrity Failures | PASS | JWT signature verified |
| A09 Logging Failures | PASS | Winston structured logging + security events |
| A10 SSRF | PASS | Path traversal test passes |
