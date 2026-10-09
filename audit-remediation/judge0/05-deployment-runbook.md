# 05 — Production Deployment Runbook for Ubuntu VPS
**MujCode Platform — End-to-End Judge0 CE Deployment Guide**

---

## 1. Step-by-Step Server Setup (Ubuntu 22.04 / 24.04 LTS)

### Step 1: Host Preparation & cgroups v1 Configuration
```bash
# SSH into clean server
ssh ubuntu@your-server-ip

# Enable hybrid cgroups v1 (Mandatory for Judge0 isolate sandbox)
sudo sed -i 's/GRUB_CMDLINE_LINUX="/GRUB_CMDLINE_LINUX="systemd.unified_cgroup_hierarchy=0 /' /etc/default/grub
sudo update-grub
sudo reboot
```

### Step 2: Install Docker Engine & Docker Compose
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu

# Verify cgroups status
stat -fc %T /sys/fs/cgroup/ # Should confirm cgroups v1 / tmpfs
```

### Step 3: Configure Firewall (UFW)
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
# ⚠️ Do NOT open port 2358 (Judge0) or 5432 / 6379 to the public internet
sudo ufw enable
```

### Step 4: Clone Repository & Configure Secrets
```bash
cd /opt
sudo git clone https://github.com/CSrajput-ux/mujcode-.git mujcode
cd mujcode/judge0

# Create production config from template
cp .env.example judge0.conf

# Generate cryptographic passwords
DB_PASS=$(openssl rand -hex 32)
REDIS_PASS=$(openssl rand -hex 32)
sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=${DB_PASS}/" judge0.conf
sed -i "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=${REDIS_PASS}/" judge0.conf
```

### Step 5: Start Stack & Verify Health
```bash
docker compose up -d

# Inspect health status
docker compose ps

# Test internal API response
curl -s http://127.0.0.1:2358/system_info | jq .
```
