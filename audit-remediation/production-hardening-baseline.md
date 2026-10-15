# Production Hardening Baseline & Technical Inventory
**Repository:** `CSrajput-ux/mujcode-`  
**Audit & Baseline Date:** October 15, 2026  
**Status:** In-Progress Hardening

---

## 1. Executive Summary

This document records the exact factual baseline of the MujCode platform prior to applying production-hardening modifications. The codebase contains a hybrid in-memory + PostgreSQL persistence tier, Redis caching/rate-limiting, Judge0 code compilation, Socket.io real-time events, and a Vite/React frontend.

---

## 2. Confirmed Issues (To Be Fixed in Code/Config)

1. **Public Default Credentials in Documentation (`P0`):**
   - **Location:** `backend/README.md` (lines 20–25).
   - **Details:** Exposes hardcoded student, faculty, admin, and company accounts with the password `chhotu.2427030521`.
2. **Weak Database Defaults in Docker Compose (`P0`):**
   - **Location:** `docker-compose.yml` (lines 50, 143, 220).
   - **Details:** Falls back to default passwords (`postgres`, `mongopassword`) if environment variables are not supplied. Must fail-closed using `${VAR:?VAR is required}`.
3. **CORS Policy Flaws & Permissive Regexes (`P0`):**
   - **Location:** `backend/src/lib/cors.js`.
   - **Details:** 
     - Allows wildcard subdomains across all of Vercel (`*.vercel.app`) and Render (`*.onrender.com`), enabling any third party hosting on Vercel/Render to send authenticated CORS requests.
     - Falls back to `DEFAULT_ALLOWED_ORIGINS` which includes `http://` unencrypted local ports even in production.
     - When `req.headers.origin` is absent, sets `Access-Control-Allow-Origin` to fallback domain instead of omitting the header.
4. **Environment Validator Enhancements (`P1`):**
   - **Location:** `backend/src/config/envValidator.js`.
   - **Details:** Needs explicit rejection of weak placeholder tokens (e.g., `change-me`, `generate-a-strong`, `secret`, `password`) and rejection of localhost database URIs in production unless running tests.
5. **Production Start Script Runs `tsx` (`P0`):**
   - **Location:** `backend/package.json` (line 8).
   - **Details:** Uses `"start": "node --import tsx/esm src/server.js"` despite the backend being pure JavaScript ESM (`"type": "module"`). `tsx` is currently listed in `dependencies` rather than `devDependencies`.
6. **Azure CI/CD Uses `npm install` (`P0`):**
   - **Location:** `.github/workflows/main_mujcode-api.yml` (line 29).
   - **Details:** Uses non-deterministic `npm install` without lockfile enforcement, and uses `npm run build --if-present` which is ambiguous.
7. **Frontend Test Suite Missing (`P1`):**
   - **Location:** `frontend/package.json`.
   - **Details:** No test runner (Vitest/Jest), no test scripts, and 0 frontend unit/component tests.

---

## 3. Already-Implemented Protections (Verified Working)

1. **JWT Algorithm Pinning & Signature Verification:**
   - `backend/src/lib/auth.js` enforces `alg: 'HS256'`, rejects `alg: 'none'` or asymmetric keys, uses `crypto.timingSafeEqual`, and validates issuer/audience.
2. **Active JWT Revocation & JTI Blacklisting:**
   - `backend/src/lib/auth.js` maintains both in-memory and Redis TTL-based revocation lists (`isTokenRevoked`, `revokeToken`).
3. **HttpOnly Cookie Handling & Token Clearing:**
   - `backend/src/routes/auth.js` attaches `HttpOnly`, `Path=/`, `Max-Age`, and conditionally `Secure` and `SameSite=Strict` in production, with explicit `Max-Age=0` clearing on logout.
4. **Parameter Pollution & NoSQL Operator Neutralization:**
   - `backend/src/app.js` (`parseQueryString`) strips `__proto__`, `constructor`, `prototype`, and keys starting with `$`.
5. **Rate Limiting:**
   - Multi-tier sliding window rate limiters (Global, Auth, Code Execution) backed by Redis with in-memory fallback (`backend/src/middlewares/rateLimiter.js`).
6. **Input Validation:**
   - Zod schema validation across routes, max code size restriction (64 KB) on judge endpoints.
7. **Production CORS Wildcard Guard:**
   - `backend/src/config/envValidator.js` halts startup if `CORS_ORIGIN=*` in production.
8. **Automated Backend Security Tests:**
   - `backend/test/security_audit.test.mjs` executes and passes 10 targeted security tests covering IDOR, mass assignment, prototype pollution, and algorithm tampering.

---

## 4. Potential Issues Requiring Manual Verification / Live Tests

1. **Linux Kernel cgroups Sandboxing for Judge0:**
   - Windows/WSL2 host does not support Linux cgroups v1 isolation required by Judge0 CE. Compiled Go, Java, and Node.js native sandboxing requires verification on an Ubuntu 22.04 LTS host.
2. **Judge0 Network Isolation:**
   - `docker-compose.yml` must ensure port 2358 is not bound to `0.0.0.0` on the public host interface in production.
3. **Admin Multi-Factor Authentication (MFA):**
   - No TOTP/MFA implementation currently exists in `backend/src/routes/auth.js` or `backend/src/services/AuthService.js`.
4. **Prometheus Metrics Endpoint Protection:**
   - `GET /metrics` in `backend/src/app.js` is currently public and should be protected by IP restriction or admin authentication.

---

## 5. Cloud & Provider Decisions Requiring Owner Input

1. **Single Production Deployment Target:**
   - Current repository contains active workflows for **Render** (via hook), **Vercel** (frontend), **Azure Web Apps** (`main_mujcode-api.yml`), and **AWS EKS** (Helm staging/production in `ci-cd.yml`).
   - The owner must designate the primary target (e.g., Render + Vercel or AWS EKS) to allow archiving conflicting pipelines.
2. **MongoDB Atlas IP Allowlist:**
   - Replace documentation recommendation of `0.0.0.0/0` with the actual outbound static IP of the deployment host (Render outbound IPs or AWS NAT Gateway).
3. **GitHub Branch Protection & Environments:**
   - GitHub web UI settings (`main` branch protection rules, required reviewers for `production` environment) require GitHub Admin privileges.
