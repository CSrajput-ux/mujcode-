# 13 — Production Deployment Runbook
**MujCode Platform — End-to-End Operational Deployment Guide**

---

## 1. Deployment Architecture Options

### Option A: Fully Managed Cloud (Recommended for Fastest Launch)
- **Frontend:** Vercel (Global Edge CDN, Automatic SSL)
- **Backend:** Render / Railway (Web Service with Auto-Deploy)
- **Database:** Neon PostgreSQL (Managed Serverless Postgres)
- **Caching & Queue:** Upstash Redis (Serverless low-latency Redis)
- **Code Execution:** Judge0 Cloud API / RapidAPI ($10/mo) or dedicated VPS

### Option B: Self-Hosted Production Server (Recommended for Maximum Cost-Efficiency)
- **Host:** Ubuntu 22.04 / 24.04 LTS (4 vCPU, 8GB RAM, 50GB NVMe)
- **Stack:** Docker Engine + Docker Compose + Nginx Reverse Proxy + Let's Encrypt Certbot
- **Services:** MujCode Backend, Nginx, PostgreSQL, Redis, Judge0 CE with isolate sandbox

---

## 2. Pre-Deployment Checklist

- [ ] Domain names acquired (e.g., `mujcode.com` and `api.mujcode.com`)
- [ ] DNS A records pointed to server IP or Vercel/Render CNAME targets
- [ ] Production secrets generated (minimum 32 characters each)
- [ ] Cloud storage provisioned (AWS S3 bucket with private ACL or Cloudinary account)
- [ ] Third-party credentials verified (Judge0 API key, SMTP mailer credentials)

---

## 3. Step-by-Step Deployment: Self-Hosted Docker VPS (Option B)

### Step 3.1: Server Initialization & System Hardening
```bash
# SSH into your clean Ubuntu server
ssh root@your-server-ip

# Update packages and install security essentials
apt update && apt upgrade -y
apt install -y curl git ufw fail2ban dumb-init htop

# Configure firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com | sh
usermod -aG docker ubuntu
```

### Step 3.2: Clone Repository & Configure Production Secrets
```bash
# Clone the repository
cd /opt
git clone https://github.com/CSrajput-ux/mujcode-.git mujcode
cd mujcode

# Create production environment file
cp .env.example .env
```

Generate cryptographically secure secrets:
```bash
# Generate high-entropy keys
echo "TOKEN_SECRET=$(openssl rand -hex 32)"
echo "POSTGRES_PASSWORD=$(openssl rand -hex 24)"
echo "REDIS_PASSWORD=$(openssl rand -hex 24)"
```

Edit `/opt/mujcode/.env`:
```ini
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://mujcode.com
TOKEN_SECRET=<generated-token-secret>
POSTGRES_URI=postgres://postgres:<generated-password>@postgres:5432/mujcode_db
POSTGRES_PASSWORD=<generated-password>
REDIS_URI=redis://:<generated-redis-password>@redis:6379
JUDGE0_URL=http://judge0_server:2358
JUDGE0_AUTH_TOKEN=<optional-judge0-token>
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

### Step 3.3: Launch Database & Run Migrations
```bash
# 1. Start Postgres and Redis core data stores
docker compose up -d postgres redis

# 2. Wait 10 seconds for Postgres to become healthy
docker compose ps

# 3. Run database migrations to provision tables & indexes
docker compose run --rm backend npm run db:migrate

# 4. Seed initial superadmin account
docker compose run --rm backend node src/scripts/seedAdmin.js
```

### Step 3.4: Launch Full Application Suite
```bash
# Start all core services (Backend replicas + Nginx)
docker compose up -d --build

# Or start with full Judge0 self-hosted code execution:
docker compose --profile judge0 up -d --build
```

### Step 3.5: Provision SSL/TLS with Certbot
```bash
# Install certbot
apt install -y certbot python3-certbot-nginx

# Obtain and install Let's Encrypt certificates
certbot --nginx -d mujcode.com -d api.mujcode.com --non-interactive --agree-tos -m admin@mujcode.com
```

---

## 4. Post-Deployment Smoke Test & Verification

Execute the automated health and API verification script:
```bash
# Verify Backend Health Endpoint
curl -i https://api.mujcode.com/health

# Verify Compiler Engine
curl -X POST https://api.mujcode.com/api/judge/run \
  -H "Content-Type: application/json" \
  -d '{"language":"python","version":"3.10","code":"print(\"Production Operational\")","input":""}'

# Verify Metrics Endpoint
curl -i https://api.mujcode.com/metrics
```

---

## 5. Day-2 Maintenance & Monitoring

### 5.1 Real-Time Log Monitoring
```bash
# Follow live backend logs across all replicas
docker compose logs -f --tail=100 backend

# Follow Nginx access & error logs
docker compose logs -f --tail=100 nginx
```

### 5.2 Zero-Downtime Rolling Updates
```bash
# Pull new git changes
git pull origin main

# Build new container images
docker compose build backend

# Rolling restart of backend replicas (Nginx will balance traffic)
docker compose up -d --no-deps --scale backend=2 backend
```

### 5.3 Automated Nightly Backup Cron
Add to `/etc/crontab`:
```cron
0 3 * * * root /opt/mujcode/scripts/backup-database.sh >> /var/log/mujcode-backup.log 2>&1
```
