# 00 — Baseline Test & Verification Results
**MujCode Platform — Pre-Remediation Verification Baseline**
**Date:** 2026-10-10 | **Commit:** `41e1c75` | **Branch:** `main` | **Working Tree:** Clean

---

## 1. Executive Baseline Summary

| Category | Suite / Check | Result | Pass | Fail | Skip | Details |
|---|---|---|---|---|---|---|
| **Backend Unit & Integration** | `node --test test/*.test.mjs` | **PASS** | 30 | 0 | 3 | 3 live Judge0 tests skipped due to Windows WSL2 cgroups v2 environment constraint |
| **Frontend Build & Typecheck** | `tsc -b && vite build` | **PASS** | - | 0 | 0 | 3,284 modules transformed, built in 7.72s |
| **Backend Security Audit** | `npm audit` | **PASS** | 0 vulns | 0 | 0 | 0 vulnerabilities found in backend dependency tree |
| **Frontend Security Audit** | `npm audit` | **FAIL** | 42 vulns | - | - | 3 High, 35 Moderate, 4 Low (TipTap, face-api/node-fetch, source-map-js) |
| **Database Pool Status** | `getPostgresPoolStats()` | **ONLINE** | - | - | - | Connected pool active with auto-migration schema |
| **Redis Cache Status** | `getRedisStats()` | **ONLINE** | - | - | - | In-memory fallback active locally, remote Redis ready |

---

## 2. Detailed Test Execution Evidence

### 2.1 Backend Test Results (`npm run test`)
```
> mujcode-backend@1.0.0 test
> node --test test/*.test.mjs

▶ Compiler & Execution Architecture Test Suite
  ✔ 1. Seven Required Languages Resolution (1.023ms)
  ✔ 2. ExecutionProviderFactory Routing (0.2129ms)
  ✔ 3. Isolated In-Memory SQL Execution Engine (4.0305ms)
  ✔ 4. SQL Test Case Evaluation (1.0469ms)
  ✔ 5. Status Normalization (0.2318ms)
  ✔ 6. Input Validation & Size Restrictions (2.4592ms)
  ✔ 7. Overall Provider Health Verification (66.4243ms)
✔ Compiler & Execution Architecture Test Suite (77.3491ms)

▶ Judge0 CE Live Integration Tests
  ✔ 1. Judge0 Health Check (104.6048ms)
  ✔ 2. Python Execution (ID 71) (1176.1787ms)
  ﹣ 3. JavaScript Execution (ID 63) (6360.4792ms) # Node.js V8 requires cgroups v1 memory controller (blocked on Windows WSL2 cgroups v2, executes on Ubuntu VPS)
  ✔ 4. C Compilation & Execution (ID 50) (1063.6749ms)
  ✔ 5. C++ Compilation & Execution (ID 54) (2090.1525ms)
  ﹣ 6. Java Execution (ID 62) (1060.9512ms) # Java JVM requires cgroups v1 address-space handling (blocked on Windows WSL2 cgroups v2, executes on Ubuntu VPS)
  ﹣ 7. Go Compilation & Execution (ID 60) (1077.8638ms) # Go runtime requires cgroups v1 thread limits (blocked on Windows WSL2 cgroups v2, executes on Ubuntu VPS)
  ✔ 8. Compilation Failure Detection (1082.654ms)
  ✔ 9. Runtime Error Detection (1096.4438ms)
✔ Judge0 CE Live Integration Tests (15115.8722ms)

▶ Security Audit Verification Suite
  ✔ 1. Authentication: Algorithm pinning & rejection of alg=none (0.945ms)
  ✔ 2. Authentication: Signature tampering detection (1.1449ms)
  ✔ 3. Authentication: Revocation & Logout Blocklist (0.9323ms)
  ✔ 4. Mass Assignment: Student writable fields allow-list (0.1914ms)
  ✔ 5. Injection: Prototype Pollution neutralization (0.3005ms)
  ✔ 6. Injection: MongoDB NoSQL Operator stripping (0.1804ms)
  ✔ 7. SSRF & Path Traversal validation (0.2087ms)
✔ Security Audit Verification Suite (5.6511ms)

▶ Storage, Scalability & Resource Management Test Suite
  ✔ 1. Granular Cache Synchronization preserves untouched collections (0.9838ms)
  ✔ 2. Granular saveDb accepts collection hint (0.2952ms)
  ✔ 3. Configurable PostgreSQL Pool Defaults & Bounds (0.2042ms)
  ✔ 4. Redis Status & Safe Fallback Operation (0.4486ms)
  ✔ 5. Client IP Trust: X-Real-IP and X-Forwarded-For resolution (0.2124ms)
  ✔ 6. getStudentTestSubmissionsPg handles disconnected state gracefully (0.4029ms)
✔ Storage, Scalability & Resource Management Test Suite (4.9689ms)

ℹ tests 33 | pass 30 | fail 0 | skipped 3 | duration_ms 15459.3745
```

---

## 3. Environment & Runtime Baseline

- **OS:** Windows 11 x64 (Local Development Environment)
- **Node.js:** v24.18.0
- **Database:** PostgreSQL (Neon Cloud / Local Pool configured)
- **Judge0 Engine:** Judge0 CE v1.13.1 running on local Docker bridge
- **Frontend Assets:** 3,284 modules compiled cleanly into `/frontend/dist/`
