# 🚀 MujCode — Deployment Guide

## Quick Deploy (Docker Compose)

### Step 1 — Environment Setup
```bash
cp .env.example .env
```

Open `.env` and set these **required** values:
```env
TOKEN_SECRET=<run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
POSTGRES_PASSWORD=<strong-password>
POSTGRES_URI=postgres://postgres:<strong-password>@postgres:5432/mujcode_db
```

### Step 2 — Choose deployment profile

#### Core Only (Backend + Frontend + PostgreSQL + Redis)
```bash
docker compose up -d
```

#### + Self-Hosted Judge0 Code Execution
```bash
cp judge0/judge0.conf.example judge0/judge0.conf
# edit judge0/judge0.conf with your settings
docker compose --profile judge0 up -d
```

#### + ATS/Placement MongoDB module
```bash
docker compose --profile ats up -d
```

#### Everything
```bash
docker compose --profile full up -d
```

---

## Service URLs

| Service | URL |
|---------|-----|
| Frontend | `http://YOUR_IP:80` |
| Backend API | `http://YOUR_IP:5000/api` |
| API Health | `http://YOUR_IP:5000/` |
| Metrics | `http://YOUR_IP:5000/metrics` |

---

## Useful Commands

```bash
# Logs
docker compose logs -f backend
docker compose logs -f nginx

# Scale backend
docker compose up -d --scale backend=4

# Rebuild after code changes
docker compose build --no-cache backend
docker compose up -d backend

# Restart
docker compose restart backend

# Stop
docker compose down
```

---

## Production Checklist

- [ ] `TOKEN_SECRET` is a random 32-byte hex (not example value)
- [ ] `POSTGRES_PASSWORD` is a strong password
- [ ] `CORS_ORIGIN` is set to your domain (not `*`)
- [ ] `.env` is NOT committed to git
- [ ] Ports 5432, 6379 are NOT exposed publicly (remove from docker-compose ports if on VPS)
- [ ] SSL/TLS configured via Nginx + Certbot or Cloudflare

---

## Cloud Platforms

### Render.com
1. Connect GitHub repo → Web Service for backend
2. Set env vars in Render dashboard
3. `POSTGRES_URI` → Neon.tech free PostgreSQL
4. `REDIS_URI` → Upstash free Redis
5. `JUDGE0_URL` → your Judge0 instance URL

### Railway
```bash
railway login && railway up
```

### VPS (DigitalOcean/Hetzner/AWS EC2)
```bash
git clone <your-repo> mujcode && cd mujcode
cp .env.example .env && nano .env
docker compose up -d
```
