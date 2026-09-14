# Self-Hosted Judge0 CE Production Deployment Guide 🚀

This document outlines the end-to-end production deployment, configuration, maintenance, and troubleshooting for the self-hosted **Judge0 CE (v1.13.1)** code execution engine within the MujCode platform.

---

## 1. System Requirements

### Hardware Requirements
- **CPU**: Minimum 2 cores (4+ cores recommended for concurrent users).
- **RAM**: Minimum 4 GB RAM (8+ GB recommended for production workloads with multiple language workers).
- **Storage**: Minimum 20 GB SSD.
- **Operating System**: **Ubuntu 20.04 LTS or 22.04 LTS (x86_64)**.

### Kernel & Cgroup Prerequisite (CRITICAL)
Judge0 relies on the `isolate` sandboxing framework, which requires **Linux cgroup v1**. Modern Ubuntu releases (21.10+) enable cgroup v2 by default.

To enable cgroup v1 on Ubuntu:
```bash
# 1. Edit GRUB configuration
sudo nano /etc/default/grub

# 2. Add systemd.unified_cgroup_hierarchy=0 to GRUB_CMDLINE_LINUX
# Example:
# GRUB_CMDLINE_LINUX="systemd.unified_cgroup_hierarchy=0"

# 3. Update GRUB and reboot
sudo update-grub
sudo reboot
```
Verify cgroup v1 after reboot:
```bash
stat -fc %T /sys/fs/cgroup/
# Output should be "tmpfs" (indicates cgroup v1)
```

---

## 2. Docker & Docker Compose Installation

Install Docker CE and the Compose plugin:
```bash
# Update package index
sudo apt update && sudo apt upgrade -y

# Install prerequisites
sudo apt install -y ca-certificates curl gnupg lsb-release

# Add Docker GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker CE and Compose plugin
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Enable and start Docker
sudo systemctl enable docker
sudo systemctl start docker

# Allow non-root docker execution (optional)
sudo usermod -aG docker $USER
```

---

## 3. Judge0 Installation & Secret Generation

### Step 1: Navigate to Judge0 directory
```bash
cd /opt/mujcode/judge0
```

### Step 2: Generate Secure Passwords
Generate two strong, 32-character random passwords:
```bash
POSTGRES_PASS=$(openssl rand -hex 16)
REDIS_PASS=$(openssl rand -hex 16)

echo "Postgres Password: $POSTGRES_PASS"
echo "Redis Password: $REDIS_PASS"
```

### Step 3: Configure `judge0.conf`
Copy the example configuration:
```bash
cp judge0.conf.example judge0.conf
```
Update `judge0.conf` with your generated passwords:
```ini
POSTGRES_USER=judge0
POSTGRES_PASSWORD=<YOUR_POSTGRES_PASS>
POSTGRES_DB=judge0
POSTGRES_HOST=judge0_db
POSTGRES_PORT=5432

REDIS_PASSWORD=<YOUR_REDIS_PASS>
REDIS_HOST=judge0_redis
REDIS_PORT=6379

CPU_TIME_LIMIT=2
MAX_CPU_TIME_LIMIT=5
CPU_EXTRA_TIME=0.5
WALL_TIME_LIMIT=5
MAX_WALL_TIME_LIMIT=10
MEMORY_LIMIT=128000
MAX_MEMORY_LIMIT=512000
STACK_LIMIT=64000
MAX_STACK_LIMIT=128000
MAX_PROCESSES_AND_OR_THREADS=64
MAX_MAX_PROCESSES_AND_OR_THREADS=128
MAX_FILE_SIZE=1024
MAX_MAX_FILE_SIZE=4096
NUMBER_OF_RUNS=1
MAX_NUMBER_OF_RUNS=1

BASE_URL=/
ENABLE_WAIT_RESULT=false
ENABLE_COMPILER_OPTIONS=true
ENABLE_COMMAND_LINE_ARGUMENTS=true
ENABLE_SUBMISSION_DELETE=false
ENABLE_CALLBACKS=true
```

---

## 4. Starting Judge0 Services

Start Judge0 database and Redis first:
```bash
# Create shared network if not already present
docker network create mujcode-network || true

# Start db and redis
docker compose -f docker-compose.yml up -d db redis

# Wait 10 seconds for DB initialization
sleep 10

# Start server and worker
docker compose -f docker-compose.yml up -d
```

Check running containers:
```bash
docker compose -f docker-compose.yml ps
```

---

## 5. Health Checks & Verification

Verify Judge0 API is responding:
```bash
curl -i http://localhost:2358/system_info
# Response should include version 1.13.1 and status 200 OK

curl -i http://localhost:2358/languages
# Response returns list of all available languages (C, C++, Java, Python, etc.)
```

Verify backend health check:
```bash
curl -i http://localhost:5000/api/judge/health
```

---

## 6. Network Security & Firewall Configuration

Judge0 should **NEVER** be publicly exposed to the internet. Keep port `2358` strictly on the internal Docker network or firewall-restricted:

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Deny public access to Judge0 port 2358, Redis 6379, Postgres 5432
sudo ufw deny 2358/tcp
sudo ufw deny 6379/tcp
sudo ufw deny 5432/tcp

# Enable UFW
sudo ufw enable
```

---

## 7. Backup & Maintenance

### Database Backup
```bash
docker exec -t judge0_db pg_dumpall -c -U judge0 > /var/backups/judge0_db_$(date +%F).sql
```

### Redis Snapshot
```bash
docker exec -t judge0_redis redis-cli -a "<YOUR_REDIS_PASS>" save
```

---

## 8. Scaling Workers & Updates

To increase throughput under high concurrent traffic:
```bash
# Scale workers to 4 instances
docker compose -f docker-compose.yml up -d --scale workers=4
```

### Safe Rollback
If you need to roll back:
```bash
docker compose -f docker-compose.yml down
# Revert configuration or image version, then:
docker compose -f docker-compose.yml up -d
```
