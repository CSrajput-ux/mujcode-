# 11 — Prioritized Remediation Plan
**MujCode Platform — Fix Priority & Action Items**

---

## P0 — CRITICAL (Fix BEFORE any production deployment)

### P0-1: Fix CORS_ORIGIN in .env
- What: CORS_ORIGIN=* in root .env
- Why: envValidator.js blocks wildcard CORS in production, meaning backend should refuse to start — or if it starts, any website can make credentialed API calls
- Fix:
  ```bash
  # In .env:
  CORS_ORIGIN=https://your-vercel-domain.vercel.app
  ```
- Effort: 5 minutes
- Downtime: No — env var change + restart
- Regression test: OPTIONS preflight from random.domain.com must receive rejected CORS

### P0-2: Implement Database Backup for Neon DB
- What: No backup procedure exists for the primary PostgreSQL database
- Why: Neon free tier can pause projects; all user data, test results, and submissions can be lost
- Fix:
  1. Enable Neon DB point-in-time restore in project settings (Neon Pro plan)
  2. OR schedule daily pg_dump to Cloudinary or S3:
  ```bash
  pg_dump $POSTGRES_URI | gzip > backup_$(date +%Y%m%d).sql.gz
  ```
  3. Store backup offsite (S3/Cloudinary) with 30-day retention
- Effort: 30-60 minutes
- Regression: Restore backup to disposable Neon branch, verify record counts

### P0-3: Add Explicit Warning on DB Fallback
- What: Silent fallback from PostgreSQL to JSON creates dual-truth risk
- Fix in storage.js — add prominent warning when falling back:
  ```js
  logger.error('[StorageEngine] CRITICAL: PostgreSQL unavailable — running on stale JSON snapshot. DATA INCONSISTENCY RISK. Restart when DB is restored.');
  ```
- Consider rejecting new writes in production when PG is down (safe mode)
- Effort: 1 hour

### P0-4: Fix Frontend Dependency Vulnerabilities
- What: @tiptap/core XSS + prototype pollution (HIGH severity)
- Fix:
  ```bash
  cd frontend
  npm install @tiptap/core@latest @tiptap/react@latest @tiptap/starter-kit@latest @tiptap/extension-link@latest @tiptap/extension-image@latest @tiptap/extension-code-block-lowlight@latest
  ```
  Target version: >=3.30.4 for @tiptap/core
- Effort: 15-30 minutes (may require API adjustments)
- Regression: Test rich-text editor still works in CreateQuestionForm and ContentHub

### P0-5: Move judge0.conf Secrets to Environment Variables
- What: Hardcoded Postgres + Redis passwords in judge0/judge0.conf
- Fix: Create judge0/judge0.env (gitignored) and reference from docker-compose.yml
- Effort: 20 minutes

---

## P1 — HIGH (Fix within 1 week of launch)

### P1-1: Audit IDOR on All User Data Endpoints
- Check every route that takes a :userId or :studentId parameter
- Ensure requireSelfOrFacultyOrAdmin is applied consistently
- Files to audit: student.js, tests.js, assignments.js, placements.js
- Effort: 2 hours

### P1-2: Add Auth to Job Status Polling Endpoint
- GET /api/judge/job-status/:jobId currently has no auth
- Low risk (random IDs) but inconsistent with security posture
- Effort: 30 minutes

### P1-3: Deploy on Ubuntu VPS to verify JS/Java/Go
- 3 of 7 compiler languages are blocked on Windows
- Cannot claim production readiness for JavaScript/Java/Go without Ubuntu test
- Effort: 1-2 hours

### P1-4: Add CSP Header to Frontend nginx.conf
- frontend/nginx.conf does not set Content-Security-Policy
- Effort: 15 minutes

---

## P2 — MEDIUM (Fix within 1 month)

### P2-1: Increase PostgreSQL Pool Size for Production
- Current POSTGRES_POOL_MAX=5 causes connection exhaustion at 500+ users
- Change to POSTGRES_POOL_MAX=15 for production
- Effort: 5 minutes

### P2-2: Add Frontend E2E Tests
- No E2E tests exist (Playwright/Cypress)
- Critical user flows are untested: login → dashboard → submit code → view result
- Effort: 2-4 days

### P2-3: Add API Integration Tests
- Currently only unit tests exist; no authenticated API integration tests
- Effort: 2-3 days

### P2-4: Remove Unused S3Service.js
- File exists but S3 integration is never called in routes
- Either implement or remove
- Effort: 5 minutes (removal)

---

## P3 — LOW (Technical Debt)

### P3-1: Upgrade Node.js Target from 20 to 22 in Frontend Dockerfile
- Frontend Dockerfile uses node:20-alpine, backend uses node:22-alpine
- Inconsistency in Node.js versions
- Effort: 5 minutes

### P3-2: Add Monitoring Alerts
- Prometheus metrics exist but no alerting rules configured
- Add alerts for: p99 > 1000ms, error rate > 5%, Redis down, PG down
- Effort: 2-4 hours

### P3-3: Rate Limiter: Fail-Open vs Fail-Closed
- When Redis is down, rate limiter uses direct INCR fallback — this is fail-open
- Consider explicit fail-closed mode for auth endpoints in production
- Effort: 1 hour

---

## P4 — COSMETIC

### P4-1: Remove data/reset_admin.mjs and test_pw.mjs from Git
- These scripts are in .gitignore already but exist in the repo (gitignore was added after first commit)
- Run: git rm --cached backend/src/data/reset_admin.mjs
- Effort: 5 minutes

### P4-2: Standardize requireAuth Usage
- Some routes call requireAuth(req, res) as a function and some use it as middleware wrapper
- Both patterns work but inconsistent style
- Effort: 1-2 hours refactoring
