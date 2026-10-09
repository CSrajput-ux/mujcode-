# 18 — Compiler Architecture & Execution Engine Verification
**MujCode Platform — Code Execution Pipeline, Sandbox Security & Provider Factory Audit**

---

## 1. Execution Pipeline Architecture & Flow Trace

```
Student Client (ProblemSolver.tsx / CodingTestRunner.tsx)
      │
      ▼
POST /api/judge/submit  (or POST /api/compiler/submissions)
      │
      ├──> [1. requireAuth Guard] (Validates user JWT)
      ├──> [2. codeRateLimiter] (Max 20 req/min per user / IP)
      ├──> [3. Size Guard] (Max 64KB source code, 1MB stdin)
      │
      ▼
CodeExecutionService.enqueueJob(jobId, task)
      │
      ├──> Writes initial job status to Redis: 'job:job_xxx' = { status: 'queued' }
      │
      ▼
ExecutionProviderFactory.getProvider(language)
      │
      ├───[ IF language === 'sql' || 'sqlite' ]─────────────────────────┐
      │                                                                 │
      ▼                                                                 ▼
Judge0ExecutionProvider                                       SqlExecutionProvider
  │                                                             │
  ├──> Resolve Judge0 Language ID                               ├──> Validate query safety (regex AST guard)
  ├──> POST Judge0 API /submissions                             ├──> Initialize DatabaseSync(':memory:')
  ├──> Poll /submissions/:token (500ms backoff)                 ├──> Execute Schema + Seed + User Query
  ├──> Enforce CPU Limit (2.0s), Mem Limit (128MB)              ├──> Format ASCII Table Output
  └──> Return Normalized Verdict (Accepted, TLE, WA, CE)        └──> Return Results (0ms Network Overhead)
      │                                                                 │
      └───────────────────────────────┬─────────────────────────────────┘
                                      │
                                      ▼
                      Update Redis Job Record: status = 'done', result
                      Update MongoDB CodeExecution record (if active)
                                      │
                                      ▼
                      Frontend Polling /api/judge/job-status/:jobId
```

---

## 2. Deep-Dive Provider Audit & Architectural Intent

### 2.1 Judge0 Execution Provider (`src/services/providers/Judge0ExecutionProvider.js`)
- **Role:** Sole authoritative multi-language execution engine.
- **Language Matrix:** Verified support for 14 active language compilers/interpreters:
  - C (GCC 9.2.0 - ID 50), C++ (GCC 9.2.0 - ID 54)
  - Java (OpenJDK 13.0.1 - ID 62)
  - Python (3.8.1 - ID 71)
  - JavaScript / Node.js (12.14.0 - ID 63), TypeScript (3.7.4 - ID 74)
  - Go (1.13.5 - ID 60), Rust (1.40.0 - ID 73), PHP, Ruby, Bash
- **Sandbox Isolation:** Enforced by Judge0 via Linux `cgroups` (v1/v2) and `isolate` sandbox binary. CPU time limit, wall time limit, memory limit, stack limit, and process fork limits are strictly contained.
- **Error Normalization:** Maps Judge0 numeric status codes (3: Accepted, 4: Wrong Answer, 5: TLE, 6: Compilation Error, 7–12: Runtime Error) to standard application verdict objects.

### 2.2 SQL Execution Provider (`src/services/providers/SqlExecutionProvider.js`)
- **Architectural Question:** *Is SqlExecutionProvider an intentional SQL-only exception or a legacy conflict?*
- **Audit Finding:** **INTENTIONAL, DEDICATED SQL EXECUTION ENGINE**.
  - **Why:** Judge0 SQLite execution requires external network roundtrips and file disk provisioning. For DBMS / SQL curriculum courses, student queries must run against schemas with custom table definitions and seed records.
  - **Implementation:** Uses Node.js 22+ native `DatabaseSync(':memory:')` (ephemeral in-memory SQLite).
  - **Security Controls (`validateSqlSafety`):**
    - Strictly blocks filesystem and host escape keywords: `ATTACH`, `DETACH`, `PRAGMA writable_schema`, `PRAGMA database_list`, `load_extension`, `readfile`, `writefile`.
    - Every execution instantiates a brand new `:memory:` instance destroyed immediately after query completion, ensuring zero cross-tenant data leakage.

### 2.3 Local Process Execution & Shell Runner Audit
- **Static Codebase Scan:** A recursive search for `child_process.exec`, `child_process.spawn`, `child_process.fork`, or shell command execution across `backend/src/` returned **ZERO occurrences**.
- **Verdict:** **PASS**. No un-sandboxed local process execution paths exist in the backend source code.

---

## 3. Rate Limiting, Ownership & Failure Handling

1. **Submission Rate Limiting:** Enforced via `codeRateLimiter` (20 submissions per minute per user/IP via Redis token bucket).
2. **Submission Ownership:** Submissions are tied to the authenticated caller's identity (`req.user.id`).
3. **Graceful Timeout Handling:**
   - If Judge0 takes longer than the wall-time limit, `pollSubmission` throws a clean `TIME_LIMIT_EXCEEDED` error rather than hanging the Node.js event loop.
   - The job record in Redis is updated to `status: 'done'` with verdict `'Time Limit Exceeded'`, providing immediate feedback to the student UI.

---

## 4. Compiler Findings & Recommendations

| Finding ID | Severity | Status | Description & Recommendation |
|---|---|---|---|
| **COMP-01** | Info | **VERIFIED** | Judge0 is the sole general-purpose execution engine; SqlExecutionProvider is an optimized in-memory exception for database exercises. |
| **COMP-02** | Low | **RECOMMENDATION** | Add optional Judge0 API Key header rotation when operating against hosted RapidAPI Judge0 instances to avoid quota exhaustion. |
