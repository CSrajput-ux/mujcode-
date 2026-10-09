# 02 — Judge0 Security Verification & Negative Sandbox Testing
**MujCode Platform — Code Execution Sandbox Hardening & Defense Verification**

---

## 1. Sandbox Hardening Controls Matrix

| Attack Vector | Security Mechanism | Enforced Policy | Test Verdict |
|---|---|---|---|
| **Infinite Loops (DoS)** | CPU time limit (2.0s), Wall limit (5.0s) | Kills process via `SIGXCPU` / `SIGKILL` -> TLE verdict | **PASS** |
| **Memory Exhaustion (OOM)**| cgroups memory limits (128 MB per process) | Process killed on malloc exceeding 128MB -> MLE verdict | **PASS** |
| **Output Bombing** | `MAX_FILE_SIZE` (1024 KB = 1 MB) | Truncates stdout/stderr at 1MB | **PASS** |
| **Fork Bomb / Process Spawning** | `MAX_PROCESSES_AND_OR_THREADS` (64) | cgroups pids controller restricts process creation | **PASS** |
| **Host Filesystem Access** | Linux `isolate` mount namespace | Ephemeral chroot sandbox directory; `/` mounted read-only | **PASS** |
| **Network Egress / SSRF** | `ENABLE_NETWORK=false` in `judge0.conf` | Network namespace has zero internet routing | **PASS** |
| **Host Secret Extraction** | Process runs as unprivileged user in isolate | Environment variables and container secrets omitted from sandbox | **PASS** |
| **Cross-User Job Snooping**| `requireSelfOrFacultyOrAdmin(req, res, job.userId)` | Reject cross-user job status polling with HTTP 403 | **PASS** |
| **Submission Flooding** | `codeRateLimiter` (Redis sliding window) | Max 20 submissions per minute per user / IP | **PASS** |
| **Oversized Payloads** | Input size guard in `judge.js` | Source code strictly capped at 64 KB, stdin at 1 MB | **PASS** |

---

## 2. Controlled Negative Test Evidence

1. **Infinite Loop Simulation:**
   ```python
   while True: pass
   ```
   - **Observed Result:** Process terminated at 2.0s with status `TIME_LIMIT_EXCEEDED`. Zero hanging backend threads.
2. **Memory Limit Simulation:**
   ```python
   x = bytearray(300 * 1024 * 1024) # 300MB allocation
   ```
   - **Observed Result:** Terminated cleanly with status `RUNTIME_ERROR` (MemoryError / OOM).
3. **Cross-User Authorization Test (`test/security_audit.test.mjs:Test 10`):**
   - Student A querying Student B's `jobId` returned HTTP 403 Forbidden.
