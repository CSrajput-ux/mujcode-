# 10 — DevSecOps, Docker & Infrastructure Audit
**MujCode Platform — Containerization, CI/CD, Orchestration & Cloud Architecture**

---

## 1. Containerization Architecture & Security Audit

### 1.1 Backend Dockerfile (`backend/Dockerfile`)
- **Base Image:** `node:22-alpine` (Minimal attack surface, musl libc, ~180MB total size).
- **Multi-Stage Build:**
  - `deps` stage installs `python3`, `make`, `g++` required to compile the native C++ `bcrypt` module.
  - `runner` stage copies *only* compiled `node_modules` and runtime code. Zero compilers/dev-tools exist in the final production container.
- **Process Management:** Uses `dumb-init` as PID 1 to ensure POSIX signals (`SIGTERM`, `SIGINT`) properly terminate child Node.js cluster processes without zombie leaks.
- **Security Hardening:**
  - Operates as non-root user `appuser:appgroup` (`UID 10001`).
  - Read-only root container filesystem compatible with writable mount for `/app/uploads` and `/app/src/data`.
- **Memory & V8 Heap Tuning:**
  - `NODE_OPTIONS="--max-old-space-size=384 --max-semi-space-size=64 --no-warnings=ExperimentalWarning"`
  - Prevents fatal OOM (Out Of Memory) container eviction on 512MB free-tier instances (e.g. Render, Railway, Fly.io).

### 1.2 Frontend Dockerfile (`frontend/Dockerfile`)
- **Stage 1 (`builder`):** `node:20-alpine` runs `npm ci` and Vite production build (`tsc -b && vite build`).
- **Stage 2 (`runner`):** `nginx:1.27-alpine` serves static assets with customized `nginx.conf`.
- **Static Asset Optimization:** HTTP/2 ready, gzip pre-compression, aggressive caching headers (`Cache-Control: public, max-age=31536000, immutable` for hashed JS/CSS assets).

---

## 2. Docker Compose Orchestration (`docker-compose.yml`)

The platform implements a profile-driven multi-service composition:

```
                  ┌──────────────────────┐
                  │     Nginx (Port 80)  │
                  └──────────┬───────────┘
                             │ (Reverse Proxy / Load Balancer)
               ┌─────────────┴─────────────┐
               ▼                           ▼
      ┌─────────────────┐         ┌─────────────────┐
      │ Backend (Repl 1)│         │ Backend (Repl 2)│
      └────────┬────────┘         └────────┬────────┘
               │                           │
    ┌──────────┼──────────────┬────────────┼──────────┐
    ▼          ▼              ▼            ▼          ▼
┌────────┐ ┌────────┐   ┌───────────┐ ┌─────────┐ ┌────────┐
│Postgres│ │ Redis  │   │ Judge0 Svr│ │Judge0 DB│ │ MongoDB│
│ (Core) │ │ (Core) │   │ (Profile) │ │(Profile)│ │ (ATS)  │
└────────┘ └────────┘   └───────────┘ └─────────┘ └────────┘
```

| Service | Profile | Resource Limits | Health Check |
|---|---|---|---|
| `backend` | Default | CPU: 2.0, Mem: 1024MB | `wget -qO- http://127.0.0.1:5000/` (20s) |
| `nginx` | Default | CPU: 1.0, Mem: 256MB | `wget -qO- http://127.0.0.1/` (20s) |
| `postgres`| Default | CPU: 1.5, Mem: 512MB | `pg_isready -U postgres` (10s) |
| `redis` | Default | CPU: 1.0, Mem: 256MB | `redis-cli ping` (10s) |
| `judge0_server` | `judge0` / `full` | CPU: 2.0, Mem: 2048MB | HTTP check `:2358/workers` (10s) |
| `judge0_workers`| `judge0` / `full` | Privileged mode (cgroups isolate) | Process monitor |
| `mongodb` | `ats` / `full` | CPU: 1.0, Mem: 512MB | `mongosh --eval 'db.adminCommand("ping")'` |

---

## 3. CI/CD Pipeline Analysis (`.github/workflows/ci-cd.yml`)

### Pipeline Stages
1. **Lint & Security Scan:** Runs `npm audit --omit=dev`, ESLint, and Secret scanning (TruffleHog / GitLeaks).
2. **Automated Unit & Compiler Tests:** Executes `node --test test/*.test.mjs` against Node 22 and Node 24 matrices.
3. **Container Build & Multi-Arch Packaging:** Builds Docker images for `linux/amd64` and `linux/arm64`.
4. **Automated Deployment:** Triggers webhook deploy to Render / Railway / Cloud VM on `main` branch push.

---

## 4. Infrastructure as Code (IaC) & Cloud Readiness

- **Terraform (`/terraform`):** Contains modules for AWS / Cloud VM provisioning (VPC, Security Groups, RDS PostgreSQL, ElastiCache Redis, S3 bucket with strict private ACL).
- **Helm Charts (`/helm`):** Kubernetes deployment manifests with Horizontal Pod Autoscaler (HPA), Ingress TLS annotations (Let's Encrypt / cert-manager), and ConfigMaps.
- **Serverless / PaaS Configs:**
  - `render.yaml`: Native blueprint for zero-config multi-service deployment on Render.
  - `vercel.json`: Clean SPA rewrite rules for frontend edge deployment.

---

## 5. DevSecOps Findings & Hardening Recommendations

1. **Docker Content Trust & Digest Pinning:** In `docker-compose.yml`, pin base images to SHA256 digests rather than floating tags like `latest` to avoid supply chain contamination.
2. **Secrets Injection:** Migrate from plain `.env` files to cloud secret managers (AWS Secrets Manager, HashiCorp Vault, or Doppler).
3. **Read-Only Root Filesystem:** In Kubernetes / ECS, mount root `/` as read-only and explicitly whitelist `/app/uploads` as tmpfs or persistent volume.
