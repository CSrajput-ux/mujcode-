# MujCode Platform — Production Deployment Architecture

**Document Version:** 1.0.0  
**Status:** Approved Architecture Standard  
**Last Updated:** October 15, 2026  

---

## 1. Architecture Overview

MujCode is deployed as an enterprise hybrid system designed for zero-downtime student assessment, real-time proctoring, and isolated multi-language code compilation.

```
                         [ Cloudflare DNS / WAF ]
                                    │
               ┌────────────────────┴────────────────────┐
               │                                         │
               ▼                                         ▼
    [ Vercel CDN (Frontend) ]                 [ Render Web Service (Backend) ]
    https://mujcode.in                        https://mujcode-api.onrender.com
    (React 18 + Vite + SPA)                   (Node.js 22 + Native ESM Cluster)
               │                                         │
               └────────────────────┬────────────────────┘
                                    │
     ┌──────────────────────────────┼──────────────────────────────┐
     │                              │                              │
     ▼                              ▼                              ▼
[ Neon.tech PostgreSQL ]    [ Upstash Redis ]              [ Ubuntu 22.04 LTS VPS ]
Primary ACID Relational     Distributed Cache /            Dedicated Judge0 CE Node
Data Store (TLS Required)   Rate Limiting (TLS Required)   (cgroups v1 Isolate Sandbox)
```

---

## 2. Designated Deployment Paths

### 2.1 Primary Production Environment (Authoritative)
- **Frontend:** **Vercel** (`deploy-vercel` job in `.github/workflows/ci-cd.yml`).
  - Framework: Vite / React
  - Domain: `https://www.mujcode.in`, `https://mujcode.in`
  - Environment Variable: `VITE_API_URL=https://mujcode-api.onrender.com`
- **Backend:** **Render Web Service** (`deploy-render` job via Render Deploy Hook).
  - Runtime: Node.js 22 LTS
  - Start Command: `node src/server.js` (No runtime transpilers)
  - Scaling: 2+ Web Concurrency workers
- **Primary Database:** **Neon.tech Managed PostgreSQL**
  - Connection: `POSTGRES_URI` with `sslmode=require`
  - Pool Max: 10–15 connections
  - Statement Timeout: 10,000ms
- **Distributed Cache & Rate Limiting:** **Upstash Redis**
  - Connection: `REDIS_URI` with TLS (`rediss://...`)
- **Media & File Storage:** **Cloudinary Media CDN**
  - PDF, PPT, and image uploads
- **Code Execution Sandbox:** **Dedicated Ubuntu 22.04 LTS VPS**
  - Upstream Judge0 CE 1.13.1 on dedicated host with Linux cgroups v1 kernel parameters.
  - Port 2358 internal only; access authenticated via `X-Auth-Token`.

### 2.2 Staging & Preview Environment
- **Frontend Staging:** Vercel Automatic Preview Deployments (per Pull Request).
- **Backend Staging:** Render Staging Web Service (`mujcode-api-staging.onrender.com`).
- **Database:** Isolated branch database on Neon.tech.

### 2.3 Alternative / Self-Hosted Path (AWS EKS & Docker Compose)
- **Container Registry:** Amazon ECR (`mujcode-backend`, `mujcode-frontend`).
- **Orchestration:** Helm chart deployed on Amazon EKS or VPS Docker Compose (`docker-compose.yml`).
- **Deployment Trigger:** Manual dispatch only (`workflow_dispatch`) with protected environment gate.

---

## 3. Required Production Secrets

The following secrets must be configured in GitHub Secrets and cloud provider dashboards:

| Secret Name | Destination | Description | Example / Generation Command |
|---|---|---|---|
| `TOKEN_SECRET` | Render / Backend `.env` | 256-bit cryptographically secure HMAC key | `openssl rand -hex 32` |
| `POSTGRES_URI` | Render / Backend `.env` | Authoritative PostgreSQL connection string | `postgres://user:pass@ep-xyz.neon.tech/neondb?sslmode=require` |
| `REDIS_URI` | Render / Backend `.env` | Upstash Redis TLS connection string | `rediss://default:pass@endpoint.upstash.io:6380` |
| `CORS_ORIGIN` | Render / Backend `.env` | Comma-separated strict domain allowlist | `https://www.mujcode.in,https://mujcode.in` |
| `MONGODB_URI` | Render / Backend `.env` | MongoDB Atlas URI for ATS placement module | `mongodb+srv://user:pass@cluster.mongodb.net/mujcode_ats?ssl=true` |
| `JUDGE0_URL` | Render / Backend `.env` | Private endpoint of Judge0 compiler VPS | `http://10.0.0.5:2358` or private reverse proxy |
| `JUDGE0_AUTH_TOKEN`| Render & Judge0 VPS | Shared secret header for Judge0 API | `openssl rand -hex 24` |
| `RENDER_DEPLOY_HOOK_URL`| GitHub Secrets | Webhook to trigger Render production build | From Render Dashboard → Settings |
| `VERCEL_TOKEN` | GitHub Secrets | Authentication token for Vercel CLI | From Vercel Dashboard → Tokens |
| `VERCEL_ORG_ID` | GitHub Secrets | Vercel Organization ID | From `vercel link` |
| `VERCEL_PROJECT_ID` | GitHub Secrets | Vercel Project ID | From `vercel link` |

---

## 4. Production Release Approval Process

1. **Pull Request Gate:**
   - No direct pushes permitted to `main`.
   - Minimum 1 Senior Maintainer approval required.
   - GitHub Actions automated checks must pass:
     - Gitleaks secret scanner
     - Backend syntax checks (`npm run check`)
     - Backend unit & integration test suite (`npm test`)
     - Frontend unit test suite (`npm test`)
     - Frontend production bundle build (`npm run build`)
2. **Staging Smoke Test:**
   - Deploy preview reviewed for UI regression, student test auto-submit timer, and code evaluation.
3. **Merge to Main:**
   - Merge commit triggers automated production deployment hook.
   - GitHub Environment `production` enforces deployment protection and audit logging.

---

## 5. Rollback Runbook

If a critical incident occurs immediately post-deployment:

### Backend Rollback (Render)
1. Navigate to **Render Dashboard** → `mujcode-api` service.
2. Click **Deploys** tab.
3. Select the previous stable commit SHA and click **Rollback to this deploy**.
4. Duration: < 60 seconds.

### Frontend Rollback (Vercel)
1. Navigate to **Vercel Dashboard** → `mujcode` project.
2. Select **Deployments** tab.
3. Locate the previous verified deployment, open the options menu, and click **Promote to Production**.
4. Duration: Instantaneous (< 5 seconds via global CDN edge switch).

### Database Schema Rollback
1. If migration errors occur, execute inverse SQL script using `migrateToPostgres.js` rollback procedure.
2. Point-in-Time Recovery (PITR) on Neon allows restoring state to any timestamp within 7 days.
