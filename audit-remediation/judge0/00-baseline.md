# 00 — Judge0 Baseline & Discovery Report
**MujCode Platform — Judge0 Execution Engine Audit**
**Date:** 2026-10-10 | **Audited Version:** Judge0 CE v1.13.1 | **Target:** Ubuntu 22.04/24.04 LTS

---

## 1. Baseline Summary

| Inspection Item | Observed Configuration | Production Assessment |
|---|---|---|
| **Judge0 Version** | `judge0/judge0:1.13.1` | Pinned stable release |
| **Sandbox Technology** | Linux `isolate` + `cgroups` | Industrial-grade sandbox |
| **Supported Languages** | C, C++, Java, Python, Node.js, Go, Rust, Ruby, PHP, Bash + in-memory SQL | Covers all curriculum requirements |
| **Port Exposure** | Bound to `127.0.0.1:2358` / internal `mujcode-net` | **SECURE** — Never exposed to public internet |
| **Credential Storage** | `judge0.conf` in `.gitignore` (untracked) | **SECURE** — Secrets isolated from Git history |
| **Local Test Suite** | `test/compiler.test.mjs` (8/8 PASS) + `test/judge0_integration.test.mjs` | Verified local execution flow |

---

## 2. Request Flow Baseline

```
Student Browser (ProblemSolver)
      │
      ▼
MUJCODE Backend (/api/judge/submit & /api/compiler/submit)
  - JWT Authentication enforced
  - Rate limiting (20 req/min per user via Redis)
  - Input validation (max 64KB code, 1MB stdin)
      │
      ▼
Judge0 REST API (Internal http://judge0_server:2358)
  - POST /submissions?base64_encoded=true&wait=false
  - Returns asynchronous submission token
      │
      ▼
Judge0 Worker Sandbox (isolate container)
  - CPU limit: 2.0s, Wall limit: 5.0s, Memory: 128MB
  - Process limit: 64 threads, Network: disabled
      │
      ▼
Backend Polling / Job Status
  - Stored in Redis (job:job_xxx with submitting userId)
  - Ownership checked on GET /api/judge/job-status/:jobId
      │
      ▼
Student Browser renders verdict, stdout, stderr, compile errors
```
