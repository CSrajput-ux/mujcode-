# 01 — Project Inventory
**MujCode Platform — Architecture Map & Component Inventory**

---

## Repository Baseline
- Branch: main
- HEAD: 41e1c75 (perf(docker): optimize free-tier memory...)
- Working tree: CLEAN (no uncommitted changes)
- Git status: 0 modified files

---

## Detected Technology Stack

### Backend
- Runtime: Node.js 22 (ESM modules, cluster mode)
- Language: JavaScript (no TypeScript transpilation in prod — tsx only in dev)
- Framework: Custom zero-dependency HTTP server (no Express/Fastify)
- Auth: Custom HS256 JWT with JTI revocation
- Primary DB: PostgreSQL 16 (Neon.tech — cloud hosted)
- Cache/Queue: Redis (ioredis) with in-memory fallback
- Secondary DB: MongoDB (Mongoose) — ATS/Placement module only
- Realtime: Socket.IO 4.8.3 with Redis adapter
- Metrics: prom-client (Prometheus format)
- File Storage: Cloudinary (media) + local /uploads (temp)
- Logging: Winston
- Compiler: Judge0 CE v1.13.1 + Node.js built-in SQLite

### Frontend
- Framework: React 18.3.1 + TypeScript 5.8.3
- Build: Vite 5.4.19
- UI: Tailwind CSS 4 + Radix UI + shadcn components
- State: Zustand 5
- Routing: React Router DOM 6
- HTTP: Axios
- Code Editor: Monaco Editor
- Realtime: Socket.IO Client
- Rich Text: TipTap 2.x
- ML/AI: TensorFlow.js + face-api.js (exam proctoring)

### Infrastructure
- Container: Docker + Docker Compose
- Reverse Proxy: Nginx (load balancer + SPA server)
- CI/CD: GitHub Actions (.github/workflows/)
- IaC: Terraform (terraform/ directory)
- Kubernetes: Helm charts (helm/ directory)
- Deployment Targets: Render (backend) + Vercel (frontend)

---

## Backend Source File Inventory

| File | Responsibility | Risk |
|------|---------------|------|
| src/server.js | Cluster master + worker bootstrap | LOW |
| src/app.js | HTTP middleware chain, CORS, metrics | LOW |
| src/config.js | Config aggregation from envValidator | LOW |
| src/config/envValidator.js | Zod schema validation at startup | LOW |
| src/config/redis.js | Redis client + in-memory fallback | MEDIUM |
| src/config/db.js | MongoDB connection | LOW |
| src/lib/auth.js | JWT sign/verify/revoke | HIGH |
| src/lib/postgres.js | PG pool, schema init, CRUD | MEDIUM |
| src/lib/storage.js | Hybrid PG+JSON+Memory engine | HIGH |
| src/lib/fastStore.js | O(1) in-memory indices | LOW |
| src/lib/rateLimiter.js | Rate limiting (3 tiers) | MEDIUM |
| src/middlewares/authMiddleware.js | requireAuth / requireRole | HIGH |
| src/services/AuthService.js | Login, refresh, password change | HIGH |
| src/services/CodeExecutionService.js | Execution dispatch + job queue | HIGH |
| src/services/Judge0Service.js | Judge0 CE API client | HIGH |
| src/services/providers/Judge0ExecutionProvider.js | Judge0 language execution | HIGH |
| src/services/providers/SqlExecutionProvider.js | SQLite ephemeral sandbox | HIGH |
| src/services/providers/ExecutionProviderFactory.js | Provider routing | MEDIUM |
| src/services/S3Service.js | AWS S3 client — UNUSED | LOW |
| src/services/CloudinaryService.js | File uploads | MEDIUM |
| src/sockets/index.js | Socket.IO setup + auth | HIGH |
| src/sockets/examProctor.js | Real-time exam monitoring | HIGH |
| src/routes/auth.js | /api/auth/* | HIGH |
| src/routes/judge.js | /api/judge/* /api/compiler/* | HIGH |
| src/routes/admin.js | /api/admin/* | HIGH |
| src/routes/student.js | /api/student/* | HIGH |
| src/routes/faculty.js | /api/faculty/* | MEDIUM |
| src/routes/problems.js | /api/problems/* | MEDIUM |
| src/routes/tests.js | /api/tests/* | MEDIUM |
| src/routes/assignments.js | /api/assignments/* | MEDIUM |
| src/routes/communities.js | /api/communities/* | LOW |
| src/routes/liveClasses.js | /api/live-classes/* | MEDIUM |
| src/routes/examSecurity.js | /api/exam-security/* | HIGH |
| src/routes/examRecovery.js | /api/exam-recovery/* | HIGH |
| src/routes/placements.js | /api/placements/* | MEDIUM |
| src/routes/content.js | /api/content/* | LOW |
| src/routes/mockTests.js | /api/mock-tests/* | LOW |
| src/routes/permissions.js | /api/permissions/* | HIGH |
| src/routes/university.js | /api/university/* | LOW |
| src/routes/helpers.js | Utility route helpers | LOW |
| src/routes/academic.js | /api/academic/* | MEDIUM |
| src/modules/ats/ | ATS/Placement drives module | MEDIUM |
| src/data/db.json | JSON fallback database | HIGH |
| src/data/students.json | Student data flat file | HIGH |
| src/data/faculty.json | Faculty data flat file | HIGH |
| src/data/reset_admin.mjs | Admin reset utility | MEDIUM |
| src/data/test_pw.mjs | Password test utility | LOW |
| src/scripts/migrateToPostgres.js | Data migration tool | MEDIUM |
| src/database/schema.sql | SQL schema reference | LOW |

---

## Frontend Source File Inventory (Key Files)

| Path | Responsibility |
|------|----------------|
| src/app/pages/LoginPage.tsx | Login UI |
| src/app/pages/LandingPage.tsx | Public landing page |
| src/app/pages/student/ | Student dashboard pages (12 pages) |
| src/app/pages/faculty/ | Faculty dashboard pages (14 pages) |
| src/app/pages/admin/ | Admin dashboard pages (8 pages) |
| src/app/pages/company/ | Company/recruiter pages (7 pages) |
| src/app/services/apiClient.ts | Axios HTTP client |
| src/app/hooks/ | Custom React hooks |
| src/features/live-classroom/ | WebRTC classroom feature |
| src/styles/ | Global CSS + Tailwind config |

---

## API Route Summary (18 route modules)

| Module | Base Path | Auth Required | Role |
|--------|-----------|--------------|------|
| auth | /api/auth | Partial | All |
| student | /api/student | Yes | student |
| faculty | /api/faculty | Yes | faculty |
| admin | /api/admin | Yes | admin |
| judge | /api/judge, /api/compiler | Yes | all |
| problems | /api/problems | Yes | all |
| tests | /api/tests | Yes | all |
| assignments | /api/assignments | Yes | all |
| placements | /api/placements | Yes | all |
| communities | /api/communities | Yes | all |
| liveClasses | /api/live-classes | Yes | all |
| examSecurity | /api/exam-security | Yes | all |
| permissions | /api/permissions | Yes | faculty/admin |
| content | /api/content | Partial | all |
| mockTests | /api/mock-tests | Yes | all |
| university | /api/university | Partial | all |
| academic | /api/academic | Yes | all |
| ats module | /api/ats | Yes | all |

---

## Dependency Map

```
Frontend (React/Vite)
    ↓ HTTPS
Nginx (Reverse Proxy / Load Balancer)
    ↓ HTTP
Backend Cluster (2+ Node.js workers)
    ├── PostgreSQL (Neon.tech) — Primary data store
    ├── Redis (Upstash/local) — Cache, rate limits, job queue, sessions
    ├── MongoDB Atlas — ATS/Placement module only
    ├── Judge0 CE — Code execution sandbox
    ├── Cloudinary — File/media storage
    └── Socket.IO (Redis adapter) — Realtime features
```
