# 🚀 MujCode — Deployment Guide

## Quick Links
- **Backend**: [Render.com](https://render.com) → Web Service
- **Frontend**: [Vercel](https://vercel.com) → Vite project
- **Database**: [Neon.tech](https://neon.tech) → Free PostgreSQL
- **Cache**: [Upstash](https://upstash.com) → Free Redis
- **MongoDB**: [MongoDB Atlas](https://cloud.mongodb.com) → Free (ATS module)
- **Files**: [Cloudinary](https://cloudinary.com) → Free media CDN

---

## Option A — Render (Backend) + Vercel (Frontend) ✅ Recommended

### Step 1 — External Services Setup

#### 1a. PostgreSQL — Neon.tech (Free)
1. Go to [neon.tech](https://neon.tech) → Create project
2. Copy **Connection String** → save as `POSTGRES_URI`
   ```
   postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
   ```

#### 1b. Redis — Upstash (Free)
1. Go to [upstash.com](https://upstash.com) → Create Redis database
2. Copy **REDIS URL (TLS)** → save as `REDIS_URI`
   ```
   rediss://default:password@xxx.upstash.io:6380
   ```

#### 1c. MongoDB Atlas (Free — only for ATS/Placement module)
1. [cloud.mongodb.com](https://cloud.mongodb.com) → Free M0 cluster
2. Database Access → Add user with password
3. Network Access → Allow `0.0.0.0/0`
4. Connect → Connection String → save as `MONGODB_URI`
   ```
   mongodb+srv://user:pass@cluster.mongodb.net/mujcode_ats?retryWrites=true&w=majority
   ```

#### 1d. Cloudinary (Free — for file uploads)
1. [cloudinary.com](https://cloudinary.com) → Sign up → Dashboard
2. Copy Cloud Name, API Key, API Secret

#### 1e. Judge0 — Railway (Code Execution)
> Skip if you don't need code execution feature

1. Fork [judge0/judge0](https://github.com/judge0/judge0) on GitHub
2. Deploy to Railway → set `REDIS_PASSWORD` + `POSTGRES_PASSWORD`
3. Copy the Railway URL → save as `JUDGE0_URL`

---

### Step 2 — Generate TOKEN_SECRET
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Save the output as `TOKEN_SECRET`.

---

### Step 3 — Deploy Backend to Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → **New** → **Web Service**
3. Connect your GitHub repo
4. Configure:
   | Setting | Value |
   |---------|-------|
   | **Root Directory** | `backend` |
   | **Build Command** | `npm ci --omit=optional` |
   | **Start Command** | `node src/server.js` |
   | **Node Version** | `22` |

5. Set **Environment Variables** in Render dashboard:

   | Variable | Value |
   |----------|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `HOST` | `0.0.0.0` |
   | `TOKEN_SECRET` | *(your generated secret)* |
   | `CORS_ORIGIN` | `https://your-app.vercel.app` |
   | `POSTGRES_URI` | *(Neon.tech connection string)* |
   | `REDIS_URI` | *(Upstash Redis URL)* |
   | `MONGODB_URI` | *(Atlas URL — optional)* |
   | `CLOUDINARY_URL` | `cloudinary://api_key:api_secret@cloud_name` |
   | `CLOUDINARY_CLOUD_NAME` | *(your cloud name)* |
   | `CLOUDINARY_API_KEY` | *(your API key)* |
   | `CLOUDINARY_API_SECRET` | *(your API secret)* |
   | `JUDGE0_URL` | *(Railway URL — optional)* |

6. Click **Deploy** → Wait for build to finish
7. Note your backend URL: `https://mujcode-api.onrender.com`

---

### Step 4 — Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Configure:
   | Setting | Value |
   |---------|-------|
   | **Framework Preset** | Vite |
   | **Root Directory** | `frontend` |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |

4. Set **Environment Variables**:
   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | `https://your-backend.onrender.com` |

5. Click **Deploy**
6. Note your frontend URL: `https://mujcode.vercel.app`

---

### Step 5 — Update CORS on Render
Go to Render → Backend service → Environment → Update `CORS_ORIGIN`:
```
https://mujcode.vercel.app
```
Then **Manual Deploy** → Restart.

---

## Option B — Docker Compose (VPS / Self-Hosted)

### Quick Start
```bash
git clone <your-repo> mujcode && cd mujcode
cp .env.example .env
nano .env   # fill in your secrets
docker compose up -d
```

### With Judge0 (Code Execution)
```bash
cp judge0/judge0.conf.example judge0/judge0.conf
# edit judge0/judge0.conf — change POSTGRES_PASSWORD and REDIS_PASSWORD
docker compose --profile judge0 up -d
```

### With ATS/Placement MongoDB
```bash
docker compose --profile ats up -d
```

### Everything
```bash
docker compose --profile full up -d
```

### Service URLs (VPS)
| Service | URL |
|---------|-----|
| Frontend | `http://YOUR_IP:80` |
| Backend API | `http://YOUR_IP:5000/api` |
| API Health | `http://YOUR_IP:5000/` |
| Metrics | `http://YOUR_IP:5000/metrics` |

---

## SSL/TLS Setup (VPS Only)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate (replace with your domain)
sudo certbot --nginx -d api.yourdomain.com -d yourdomain.com
```

---

## Useful Commands

```bash
# View logs
docker compose logs -f backend

# Rebuild after code changes
docker compose build --no-cache backend
docker compose up -d backend

# Scale backend workers
docker compose up -d --scale backend=4

# Restart
docker compose restart backend

# Stop all
docker compose down
```

---

## Production Checklist

- [ ] `TOKEN_SECRET` is a random 32-byte hex (not example value)
- [ ] `POSTGRES_PASSWORD` is a strong password
- [ ] `CORS_ORIGIN` is set to your exact Vercel domain (not `*`)
- [ ] `.env` is NOT committed to git
- [ ] Ports 5432, 6379, 27017 are NOT exposed publicly
- [ ] SSL/TLS configured (Certbot or Cloudflare proxy)
- [ ] `JUDGE0_URL` set correctly (or leave empty if not using code execution)
- [ ] Cloudinary credentials configured for file upload support
- [ ] MongoDB Atlas IP allowlist set (`0.0.0.0/0` for Render, or specific IPs for VPS)
