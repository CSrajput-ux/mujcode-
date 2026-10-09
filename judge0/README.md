# Judge0 CE — Self-Hosted Compiler Deployment Guide
**MujCode Platform — Code Execution Infrastructure (v1.13.1)**

---

## 1. Architecture Overview

Judge0 CE provides sandboxed code execution for MUJCODE:
- **`judge0_server`:** Internal REST API gateway (Port 2358, bound to `127.0.0.1` / internal Docker bridge).
- **`judge0_workers`:** Replicated sandbox workers (3-4 replicas) utilizing Linux `isolate` and `cgroups`.
- **`judge0_db`:** PostgreSQL 13 metadata store for submissions and language configurations.
- **`judge0_redis`:** Low-latency queue broker for asynchronous submission scheduling.

---

## 2. Host Prerequisites (Ubuntu 22.04 / 24.04 LTS)

Judge0 isolate sandbox requires Linux cgroups v1 compatibility.

```bash
# 1. Check current cgroup version
stat -fc %T /sys/fs/cgroup/
# If output is 'cgroup2fs', enable hybrid cgroups v1:

# 2. Edit GRUB configuration
sudo nano /etc/default/grub

# Append to GRUB_CMDLINE_LINUX:
# GRUB_CMDLINE_LINUX="systemd.unified_cgroup_hierarchy=0"

# 3. Update GRUB and reboot
sudo update-grub
sudo reboot
```

---

## 3. Quick Start Deployment

```bash
cd judge0

# 1. Create production configuration
cp .env.example judge0.conf

# 2. Generate strong passwords
sed -i "s/generate_strong_password_here_via_openssl_rand_hex_32/$(openssl rand -hex 32)/g" judge0.conf

# 3. Launch the stack
docker compose up -d

# 4. Verify service health
docker compose ps
curl -i http://127.0.0.1:2358/system_info
```

---

## 4. Upgrade Procedure

```bash
# 1. Backup current database
docker compose exec db pg_dump -U judge0 judge0 | gzip > "judge0_backup_$(date +%Y%m%d).sql.gz"

# 2. Pull new pinned version tag in docker-compose.yml
# Update image: judge0/judge0:<NEW_VERSION>

# 3. Recreate services
docker compose pull
docker compose up -d --no-deps server workers
```

---

## 5. Rollback Procedure

```bash
# 1. Revert image tag in docker-compose.yml to 1.13.1
# 2. Restart services
docker compose up -d --force-recreate
```
