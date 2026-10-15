# Judge0 Production Host & Sandbox Security Requirements

**Document Version:** 1.0.0  
**Effective Date:** October 15, 2026  
**System:** MujCode Self-Hosted Code Execution Engine (Judge0 CE v1.13.1)

---

## 1. Host Infrastructure Requirements

> [!CRITICAL]
> **Do not run Judge0 Sandbox in production on Windows, macOS, or WSL2.**
> Judge0's isolation mechanism relies on the Linux `isolate` utility, which requires Linux kernel cgroups v1. Executing untrusted student code on non-Linux hosts exposes the host system to sandbox escapes and denial of service.

### 1.1 Supported Operating System
- **Recommended OS:** Ubuntu Linux 22.04 LTS or 24.04 LTS (x86_64).
- **Kernel Version:** Linux Kernel 5.15+ or 6.x.
- **Dedicated Host Recommendation:** Run Judge0 workers on a dedicated virtual machine (e.g. AWS EC2 `c5.xlarge` or `c5a.xlarge` instance) strictly isolated from the backend API, PostgreSQL database, and internal VPC services.

### 1.2 Kernel Cgroups Configuration
Judge0's sandbox utilizes `isolate`, which requires cgroup v1. On modern Linux distributions (such as Ubuntu 22.04+ where systemd uses cgroups v2 by default), enable hybrid or cgroups v1 hierarchy:

1. Edit `/etc/default/grub`:
   ```bash
   GRUB_CMDLINE_LINUX="systemd.unified_cgroup_hierarchy=0"
   ```
2. Update grub and reboot:
   ```bash
   sudo update-grub
   sudo reboot
   ```
3. Verify cgroups v1 availability:
   ```bash
   mount | grep cgroup
   ```

---

## 2. Network & Firewall Hardening

1. **Port Isolation:**
   - Judge0 API Port (`2358`) MUST NOT be bound to `0.0.0.0`.
   - In `judge0/docker-compose.yml`, the port is bound to `127.0.0.1:2358:2358`.
   - For multi-server setups, access must only be permitted via private VPC security groups or an encrypted WireGuard/mTLS tunnel from the MujCode backend IP.
2. **Database & Redis Containment:**
   - Judge0's PostgreSQL (`5432`) and Redis (`6379`) instances must never publish host ports. They communicate exclusively through the internal Docker bridge network (`mujcode-net`).
3. **Outbound Sandbox Egress:**
   - Student execution processes inside the sandbox must have network access disabled (`--share-net=false` in isolate configuration) to prevent SSRF and external scanning.

---

## 3. Strict Resource Limits

The following resource caps are enforced in `judge0.conf` and clamped programmatically in `backend/src/services/Judge0Service.js`:

| Resource Parameter | Default Value | Hard Maximum Allowed | Enforcement Mechanism |
|---|---|---|---|
| **CPU Time Limit** | 2.0 seconds | 5.0 seconds | `CPU_TIME_LIMIT`, clamped in `Judge0Service` |
| **Wall Clock Time Limit** | 5.0 seconds | 10.0 seconds | `WALL_TIME_LIMIT`, kills hung threads |
| **Memory Limit** | 128 MB (Java: 1 GB) | 512 MB (Java: 2 GB) | `MEMORY_LIMIT`, cgroup memory controller |
| **Stack Size Limit** | 64 MB | 128 MB | `STACK_LIMIT` |
| **Max Concurrent Processes** | 64 processes | 128 processes | `MAX_PROCESSES_AND_OR_THREADS` (prevents fork bombs) |
| **Max Output / File Size** | 1,024 KB (1 MB) | 4,096 KB (4 MB) | `MAX_FILE_SIZE` (prevents stdout disk filling) |

---

## 4. Upgrade & Rollback Procedures

### 4.1 Upgrade Procedure
1. Create a snapshot of Judge0 Redis and PostgreSQL volumes (`judge0_db_data`, `judge0_redis_data`).
2. Pull the target Judge0 CE container release:
   ```bash
   docker pull judge0/judge0:<new-version>
   ```
3. Update `judge0/docker-compose.yml` with the verified tag.
4. Apply rolling restart:
   ```bash
   docker compose down
   docker compose up -d
   ```
5. Execute health check:
   ```bash
   curl -s http://127.0.0.1:2358/system_info
   ```

### 4.2 Rollback Procedure
1. In the event of submission failures or sandbox instability:
   ```bash
   docker compose down
   ```
2. Revert `judge0/docker-compose.yml` to image `judge0/judge0:1.13.1`.
3. If database schema was altered, restore `judge0_db_data` from snapshot.
4. Bring services back online:
   ```bash
   docker compose up -d
   ```

---

## 5. Monitoring & Health Probes

1. **API Liveness Probe:** `GET http://127.0.0.1:2358/system_info` (verifies API daemon and worker queue).
2. **Prometheus Metrics:** Monitor worker queue latency, active job count, and container CPU/memory saturation.
3. **Queue Stalls:** If Redis queue length exceeds 100 pending submissions for > 60 seconds, alert on-call engineering.

---

## 6. Language Validation Status (Host vs Container Execution)

| Language | Test Status | Execution Provider / Environment |
|---|---|---|
| **JavaScript (Node.js)** | ✅ `PASS` | Verified via `test/compiler.test.mjs` & native Node execution |
| **Python (3.x)** | ✅ `PASS` | Verified via `test/compiler.test.mjs` & local Python runtime |
| **Java (OpenJDK 17/21)** | ✅ `PASS` | Verified via `test/judge0_integration.test.mjs` |
| **C (GCC / Clang)** | ✅ `PASS` | Verified via `test/judge0_integration.test.mjs` |
| **C++ (G++ / Clang++)** | ✅ `PASS` | Verified via `test/judge0_integration.test.mjs` |
| **SQL (SQLite in-memory)**| ✅ `PASS` | Verified via `test/compiler.test.mjs` (Isolated SQL Execution Provider) |
| **Go** | ⚠️ `NOT VERIFIED` | Local toolchain unavailable and container evidence not attached |

> [!WARNING]
> Local host test passes on Windows/macOS verify runtime syntax and local fallback execution, but do NOT provide cgroups v1 kernel sandbox isolation. Production code execution MUST run on a dedicated Linux host.

---

## 7. Security Incident Response Playbook for Sandbox Escapes

1. **Immediate Quarantine:** Sever network bridge of Judge0 containers:
   ```bash
   docker network disconnect mujcode-network judge0_server
   docker network disconnect mujcode-network judge0_workers
   ```
2. **Halt Worker Daemons:** Force-terminate execution to stop fork bombs or runaway loops:
   ```bash
   docker kill --signal=SIGKILL judge0_workers
   ```
3. **Inspect Submission Logs:** Review offending submission token and payload in `judge0.log`.
4. **Purge Redis Queue:** Flush pending submissions:
   ```bash
   docker exec -it judge0_redis redis-cli -a "$REDIS_PASSWORD" FLUSHALL
   ```
5. **Re-provision Clean Host:** If sandbox escape compromised the underlying host, destroy VM and re-provision using Terraform/Ansible.

