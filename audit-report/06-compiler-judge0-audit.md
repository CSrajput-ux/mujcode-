# 06 — Compiler & Judge0 Audit
**MujCode Platform — Code Execution Security & Language Verification**

---

## Architecture Overview

The platform uses a dual-engine execution pattern:

```
Frontend (ProblemSolver / CodingTestRunner)
    ↓ POST /api/judge/submit OR /api/compiler/submissions
Backend (judge.js route)
    ↓ CodeExecutionService.enqueueJob()
    ExecutionProviderFactory
    ├── Judge0ExecutionProvider  → Judge0 CE v1.13.1 (HTTP API)
    └── SqlExecutionProvider    → node:sqlite ephemeral in-memory
```

---

## Language Verification Results

| Language | Judge0 ID | Test Result | Evidence |
|----------|-----------|-------------|---------|
| C (GCC 9.2.0) | 50 | PASS | 1205ms, Accepted |
| C++ (GCC 9.2.0) | 54 | PASS | 2127ms, Accepted |
| Python (3.8.1) | 71 | PASS | 2610ms, Accepted |
| JavaScript (Node.js 12.14.0) | 63 | BLOCKED | cgroups v1 required (WSL2 cgroup v2) |
| Java (OpenJDK 13.0.1) | 62 | BLOCKED | cgroups v1 required (WSL2 cgroup v2) |
| Go (1.13.5) | 60 | BLOCKED | cgroups v1 required (WSL2 cgroup v2) |
| SQL (SQLite 3) | native | PASS | <1ms, ephemeral sandbox |

**Blocked languages status:** These fail ONLY on Windows WSL2 due to cgroups v2. Per docs/JUDGE0_DEPLOYMENT.md, all 7 languages PASS on Ubuntu 22.04 LTS with GRUB cgroup v1 enabled.

---

## Judge0 Configuration Review

File: judge0/judge0.conf

| Setting | Value | Assessment |
|---------|-------|------------|
| ENABLE_NETWORK | false | GOOD — no network in sandbox |
| ENABLE_PER_PROCESS_AND_THREAD_TIME_LIMIT | true | GOOD |
| ENABLE_PER_PROCESS_AND_THREAD_MEMORY_LIMIT | true | GOOD |
| CPU_TIME_LIMIT | 5s | ACCEPTABLE |
| WALL_TIME_LIMIT | 10s | ACCEPTABLE |
| MEMORY_LIMIT | 512000 KB | 512 MB — GENEROUS for contest problems |
| ENABLE_COMPILER_OPTIONS | false | GOOD — prevents compiler flag injection |
| ENABLE_COMMAND_LINE_ARGUMENTS | false | GOOD — prevents argument injection |
| ENABLE_SUBMISSION_DELETE | false | GOOD |
| ENABLE_CALLBACKS | false | GOOD |
| MAX_FILE_SIZE | 1024 KB | GOOD |
| BASE_URL | / | OK |

---

## SQL Sandbox Security Review

File: src/services/providers/SqlExecutionProvider.js

### Blocked Operations (PASS)
```
ATTACH DATABASE  → BLOCKED
DETACH DATABASE  → BLOCKED
PRAGMA writable_schema → BLOCKED
load_extension   → BLOCKED
readfile()       → BLOCKED
writefile()      → BLOCKED
```

### Resource Limits (PASS)
- Max row return: 1000 (configurable, default 100)
- Max page count: 5000 (≈20 MB memory ceiling)
- Execution timeout: 2 seconds hard limit with early-break on iterators
- Each query runs in fresh ephemeral `:memory:` database — zero state persistence

### Security Controls — PASS
- Foreign keys enabled: `PRAGMA foreign_keys = ON`
- No file system access possible from SQLite in-memory mode
- Each submission gets fresh isolated database instance

---

## Submission Lifecycle

1. POST /api/judge/submit → auth + rate limit (20/min) check
2. Code size validated: max 64 KB
3. Job record created in MongoDB (CodeExecution model)
4. Unique jobId generated: `job_{timestamp}_{random}`
5. Job enqueued via `setImmediate()` — non-blocking
6. Job state tracked in Redis with 1-hour TTL
7. Frontend polls GET /api/judge/job-status/:jobId
8. On completion, MongoDB record updated with verdict

---

## Security Assessment

### Container Isolation
- Judge0 CE runs inside Docker container with `privileged: true`
- Note: `privileged: true` is required for isolate sandbox (cgroups v1) but expands attack surface
- Mitigation: Judge0 port 2358 is NEVER exposed to host (commented out in docker-compose.yml)
- Internal communication only via mujcode-net bridge network

### Rate Limiting
- Code execution: 20 requests/minute per user
- Additional per-user 3-second minimum interval
- Authenticated: 30 requests/minute; unauthenticated: 10/minute
- Test verified: PASS (6. Input Validation & Size Restrictions)

### Code Size Limits
- Route-level: 64 KB hard limit
- Service-level: 100 KB hard limit
- Stdin: 1 MB hard limit

### Submission Isolation (PASS)
- Each submission gets unique token from Judge0
- Results tied to submissionId + userId in MongoDB
- No cross-user result leakage possible

### Job Status Endpoint — Security Note
- GET /api/judge/job-status/:jobId has NO auth check
- Any user who knows a jobId can poll its status
- Risk: LOW — jobIds are random and unguessable
- Recommendation: Add auth check for consistency

---

## Test Results

```
Compiler & Execution Architecture Test Suite:
  1. Seven Required Languages Resolution: PASS (1.29ms)
  2. ExecutionProviderFactory Routing: PASS (0.23ms)
  3. Isolated In-Memory SQL Execution Engine: PASS (4.38ms)
  4. SQL Test Case Evaluation: PASS (0.99ms)
  5. Status Normalization: PASS (0.20ms)
  6. Input Validation & Size Restrictions: PASS (1.77ms)
  7. Overall Provider Health Verification: PASS (191.89ms)

Judge0 CE Live Integration Tests:
  1. Judge0 Health Check: PASS (278ms)
  2. Python Execution (ID 71): PASS (2610ms) - Hello World verified
  3. JavaScript (ID 63): SKIP (cgroups v2)
  4. C Compilation & Execution (ID 50): PASS (1205ms)
  5. C++ Compilation & Execution (ID 54): PASS (2127ms)
  6. Java (ID 62): SKIP (cgroups v2)
  7. Go (ID 60): SKIP (cgroups v2)
  8. Compilation Failure Detection: PASS (1086ms)
  9. Runtime Error Detection: PASS (1078ms)
```

---

## Recommendations

1. Add auth check to GET /api/judge/job-status/:jobId (LOW priority)
2. Deploy on Ubuntu VPS to verify JS/Java/Go before production
3. Monitor Judge0 worker memory usage — 4 parallel workers at 512 MB each = 2 GB minimum
4. Consider adding submission cleanup job for old CodeExecution MongoDB records
5. Enable ENABLE_WAIT_RESULT=true only on low-traffic instances to reduce polling
