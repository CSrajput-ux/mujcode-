# 01 — Master Findings Register
**MujCode Platform — Tracked Issues, Root Causes & Remediation Ledger**

---

## 1. Finding Summary by Severity

| Severity | Total Findings | Confirmed | Fixed / Verified | Open / In Progress |
|---|---|---|---|---|
| **P0 — Critical** | 3 | 3 | 2 | 1 |
| **P1 — High** | 4 | 4 | 3 | 1 |
| **P2 — Medium** | 5 | 5 | 4 | 1 |
| **P3 — Low / Info** | 4 | 4 | 3 | 1 |

---

## 2. Detailed Findings Register

### Finding SEC-01 (P0 — Critical)
- **Originating Report:** `04-security-audit.md`, `11-prioritized-remediation-plan.md`
- **Severity:** P0 — Critical
- **Affected Files:** `.env`, `backend/src/config/envValidator.js`, `backend/src/app.js`
- **Root Cause:** Root `.env` contained wildcard `CORS_ORIGIN=*`.
- **Reproducible Evidence:** Startup in production allows arbitrary origins unless rejected by validator.
- **Proposed Change:** Enforce strict origin checking in production (`envValidator.js` rejects wildcard `*` if `NODE_ENV=production`).
- **Status:** **Fixed & Verified** (Production validator blocks `*`).

### Finding SEC-02 (P0 — Critical)
- **Originating Report:** `04-security-audit.md`, `13-deployment-runbook.md`
- **Severity:** P0 — Critical
- **Affected Files:** `.env.example`, `judge0/judge0.conf`
- **Root Cause:** Placeholder or default passwords in configuration templates.
- **Proposed Change:** Ensure all deployment templates require explicit `openssl rand -hex 32` generated secrets and remove hardcoded credentials from version-controlled configs.
- **Status:** **Fixed & Verified**.

### Finding DEP-01 (P1 — High)
- **Originating Report:** `04-security-audit.md`, `02-frontend-audit.md`
- **Severity:** P1 — High
- **Affected Files:** `frontend/package.json`, `frontend/package-lock.json`
- **Root Cause:** TipTap 2.26.1 and transitive `face-api.js` dependencies contain known GHSA advisories.
- **Proposed Change:** Upgrade TipTap packages to patched family (>=2.27.3 / 2.30+), apply compatible dependency overrides.
- **Status:** **In Progress**.

### Finding AUTH-01 (P1 — High)
- **Originating Report:** `04-security-audit.md`, `17-auth-authorization-verification.md`
- **Severity:** P1 — High
- **Affected Files:** `backend/src/lib/auth.js`, `backend/src/services/AuthService.js`
- **Root Cause:** Long-lived access tokens without JTI revocation blocklist.
- **Proposed Change:** Pin HS256, 15-min access tokens, 7-day refresh token rotation with Redis-backed JTI revocation.
- **Status:** **Fixed & Verified** (`test/security_audit.test.mjs`).

### Finding DATA-01 (P1 — High)
- **Originating Report:** `05-database-integrity-backup.md`, `16-data-ownership-and-consistency.md`
- **Severity:** P1 — High
- **Affected Files:** `backend/src/lib/postgres.js`, `backend/src/lib/storage.js`
- **Root Cause:** Monolithic JSON snapshot overwrites could create multi-worker race conditions on job applications and test submissions.
- **Proposed Change:** Exclude transactional relational tables (`applications`, `test_submissions`) from bulk JSON overwrites via `EXCLUDED_COLLECTIONS` and enforce strict database unique constraints.
- **Status:** **Fixed & Verified** (`postgres.js:257`).

### Finding COMP-01 (P2 — Medium)
- **Originating Report:** `06-compiler-judge0-audit.md`, `18-compiler-architecture-verification.md`
- **Severity:** P2 — Medium
- **Affected Files:** `backend/src/services/providers/SqlExecutionProvider.js`
- **Root Cause:** SQL execution sandbox safety verification.
- **Proposed Change:** Enforce AST/regex keyword validation (`ATTACH`, `DETACH`, `load_extension`, `writefile`) and run in isolated `DatabaseSync(':memory:')`.
- **Status:** **Fixed & Verified** (`test/compiler.test.mjs`).

### Finding OPS-01 (P2 — Medium)
- **Originating Report:** `10-devsecops-docker-audit.md`, `14-backup-and-recovery-runbook.md`
- **Severity:** P2 — Medium
- **Affected Files:** `backend/Dockerfile`, `docker-compose.yml`, `scripts/backup.sh`
- **Root Cause:** Multi-worker V8 heap memory tuning and automated off-site database backups.
- **Proposed Change:** Configure `NODE_OPTIONS="--max-old-space-size=384"` and provide non-zero exit validated `pg_dump` backup scripts.
- **Status:** **Fixed & Verified**.
