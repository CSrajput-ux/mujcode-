# MUJCODE Compiler Engine — Architectural Audit Report & Implementation Plan

**Author:** Senior Compiler Infrastructure & DevSecOps Engineering Team  
**Date:** October 10, 2026  
**System:** MUJCODE Coding & Assessment Platform  

---

## 1. Executive Summary

MUJCODE currently utilizes the official upstream **Judge0 CE v1.13.1** container image (`judge0/judge0:1.13.1`), which occupies **14.2 GB of unpacked disk space** on the host. An exhaustive audit reveals that this monolithic image packages runtimes and toolchains for over 60 programming languages (including Rust, Haskell, Mono/.NET, Swift, Kotlin, Scala, Erlang, Fortran, Pascal, and OCaml) that are entirely unused by the MUJ curriculum.

Furthermore, Judge0's underlying execution sandbox relies on `isolate` with Linux cgroups v1 (`/sys/fs/cgroup/memory/`). In modern developer environments and deployment targets utilizing Linux cgroups v2 (such as Docker Desktop on WSL2), this architecture induces severe memory-allocation failures (`Error occurred during initialization of VM: Could not reserve enough space for 256000KB object heap` in Java, and thread limit blocks in Go and Node.js).

This report outlines the design, implementation, and deployment of **MUJCODE Compiler Engine** — a purpose-built, secure, lightweight asynchronous code execution service supporting **exactly the seven required language families**: C, C++, Java, Python, JavaScript, Go, and SQL.

---

## 2. Existing System Architecture Discovered

### 2.1 Backend Architecture
- **Framework:** Node.js (ES Modules, v24/22 compatible) running with `tsx` / clustering support.
- **Data Persistence:**
  - PostgreSQL (`mujcode_db`) for users, assignments, and test submissions.
  - In-memory / file-backed JSON (`db.json`) for course problem metadata.
  - Redis (with resilient in-memory fallback) for rate limiting, cluster synchronization, and async job queues.
- **Compiler Subsystem:**
  - `CodeExecutionService.js`: Central coordinator for all code execution requests.
  - `ExecutionProviderFactory.js`: Factory routing queries to execution providers.
  - `Judge0Service.js`: REST client interfacing with Judge0 HTTP API (`http://127.0.0.1:2358`).
  - `Judge0ExecutionProvider.js`: Provider encapsulating Judge0 job creation and status polling.
  - `SqlExecutionProvider.js`: Ephemeral in-memory database execution engine with safety AST/pattern filtering.
  - `LocalExecutionProvider.js`: Native host compiler provider for C, C++, Python, JavaScript, and Java.
- **API Routing:**
  - `/api/judge/run`: Synchronous single-run execution with custom stdin.
  - `/api/judge/submit`: Asynchronous problem test-case judging.
  - `/api/judge/submissions/:userId/:problemId`: Polling/retrieval of historical verdicts.
  - `/api/judge/languages`: List of active supported execution environments.

### 2.2 Frontend Architecture
- **Framework:** React 18 with TypeScript, Vite, Tailwind CSS, Monaco / Web Code Editor.
- **Problem Solver:** `ProblemSolver.tsx` exposes a curated language selector supporting:
  - C (`c`)
  - C++ (`cpp`)
  - Java (`java`)
  - Python (`python`)
  - JavaScript (`javascript`)
  - Go (`go`)
  - SQL (`sql`)
- The UI handles tabs for Description, Console/Stdin, Execution Metrics (Time/Memory), Compilation Errors, and Test Case evaluation tables.

### 2.3 Docker Deployment State
| Service | Image | Size on Disk | Role | Status |
|---|---|---|---|---|
| `judge0_server` | `judge0/judge0:1.13.1` | 14.2 GB (shared) | API Gateway | Active on `127.0.0.1:2358` |
| `judge0-workers` | `judge0/judge0:1.13.1` | 14.2 GB (shared) | Sandboxed Workers | Active (1 replica) |
| `judge0_redis` | `redis:7` | 182 MB | Worker Queue | Active on internal network |
| `judge0_db` | `postgres:13-alpine` | 384 MB | Judge0 Job DB | Active on internal network |

---

## 3. Architectural Decision: Custom Lightweight Engine (Approach B)

We evaluated two implementation paths:

### Approach A: Forking and Customizing Upstream Judge0
- **Pros:** Preserves Judge0 internal Ruby on Rails codebase.
- **Cons:**
  1. Judge0 uses the `isolate` sandboxing binary compiled specifically for Linux cgroups v1. WSL2 and modern Linux distros (Ubuntu 22.04+, Debian 12+) use unified cgroups v2 by default. This causes persistent crashes for Java (heap allocation), Go (thread quotas), and Node.js (V8 memory reservations).
  2. Stripping 50+ languages from Judge0's complex multi-layer Dockerfile requires rebuilding heavy Rails and Ruby gem dependencies, still resulting in a 4+ GB image with brittle dependencies.

### Approach B: Purpose-Built MUJCODE Compiler Engine (Selected)
- **Architecture:** Standalone, lightweight Node.js/Linux-based asynchronous execution daemon (`compiler-engine`).
- **Benefits:**
  1. **88%+ Size Reduction:** Builds a clean Debian/Ubuntu-slim container with **only the 7 required compilers and tools**, reducing disk usage from **14.2 GB to ~1.4 GB**.
  2. **100% Dual-API Compatibility:**
     - Exposes the Judge0 REST contract (`POST /submissions`, `GET /submissions/:token`, `GET /languages`) for drop-in backend compatibility without modifying frontend contracts.
     - Also exposes the clean `/api/compiler/*` endpoints specified in the master prompt.
  3. **Cgroups v2 & WSL2 Native Resilience:** Executes sandboxed processes with POSIX `prlimit` / process-level quotas and namespace containment without hitting isolate's legacy cgroup v1 traps.
  4. **Zero Downtime & Safe Rollback:** Deployed as a separate service (`mujcode_compiler_engine`) on a dedicated port (`2359`). The existing Judge0 service (`2358`) remains online until all verification gates pass.

---

## 4. Centralized Language Registry

The seven approved language families are registered with strict security limits:

| Language ID | Display Name | Compiler / Runtime | Pinned Version | File Ext | Compile Required | Default Timeout | Max Timeout | Memory Ceiling | Output Limit |
|---|---|---|---|---|---|---|---|---|---|
| `c` (50) | C (GCC) | `gcc` | 12.2.0 | `.c` | Yes (`gcc -O2 source.c -o out.bin`) | 2.0s | 5.0s | 256 MB | 256 KB |
| `cpp` (54) | C++ (G++) | `g++` | 12.2.0 | `.cpp` | Yes (`g++ -O2 source.cpp -o out.bin`) | 2.0s | 5.0s | 256 MB | 256 KB |
| `java` (62) | Java (OpenJDK) | `javac` / `java` | OpenJDK 17 | `.java` | Yes (`javac -encoding UTF-8`) | 3.0s | 7.0s | 512 MB | 256 KB |
| `python` (71) | Python 3 | `python3` | 3.11.2 | `.py` | No (`python3 -u`) | 3.0s | 7.0s | 256 MB | 256 KB |
| `javascript` (63) | JavaScript (Node.js) | `node` | 20.x LTS | `.js` | No (`node --max-old-space-size=128`) | 2.0s | 5.0s | 256 MB | 256 KB |
| `go` (60) | Go | `go` | 1.20+ | `.go` | Yes (`go build -o out.bin`) | 3.0s | 7.0s | 256 MB | 256 KB |
| `sql` (82) | SQL (Isolated Engine) | `sqlite3` / In-Memory Engine | 3.40+ | `.sql` | No (AST Safety + Isolated Instance) | 2.0s | 5.0s | 128 MB | 512 KB |

---

## 5. Security & Isolation Controls

Every submission is treated as untrusted and potentially hostile:
1. **Unprivileged Execution:** All user processes execute under a dedicated unprivileged user (`compilerbox`, UID 1001, GID 1001).
2. **Ephemeral Job Workspaces:** Each submission creates a randomly generated UUID directory in `/tmp/mujbox/<uuid>` with mode `0700`. The directory is guaranteed to be deleted in a `finally` block.
3. **No Network Access:** Submissions cannot initiate outbound network sockets.
4. **No Docker Socket Mounting:** The Docker daemon socket is strictly forbidden inside the execution worker.
5. **No Production Credential Exposure:** Worker processes run without environment variables containing DB passwords, JWT secrets, or cloud keys.
6. **Strict Resource Enforcement:**
   - Wall-clock & CPU timeout enforced via asynchronous timers sending `SIGTERM` followed by `SIGKILL` (after 500ms grace period).
   - Maximum output size capped at 256 KB (preventing output disk flooding).
   - Maximum source code length capped at 64 KB.
   - Maximum stdin size capped at 512 KB.
