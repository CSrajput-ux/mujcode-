# 03 — Backend API & Service Architecture Audit
**MujCode Platform — Server-Side Engineering, API Surface & Middleware Assessment**

---

## 1. Technical Stack & Service Topology

| Component | Technology | Configuration / Version |
|---|---|---|
| **Runtime** | Node.js | v24.18.0 (ES Modules `type: module`) |
| **Execution Tooling** | `tsx` (TypeScript Execution) | v4.23.1 (Watches `src/server.js`) |
| **API Framework** | Native HTTP / Express-compatible routing | Custom high-throughput router & middleware pipeline |
| **Primary Database** | PostgreSQL (Neon Cloud / Local PG) | `pg` v8.23.0 with connection pooling |
| **Document Store** | MongoDB (Optional ATS module) | `mongoose` v9.7.4 |
| **Caching & Pub/Sub**| Redis (Local / Upstash / AWS ElastiCache)| `ioredis` v6.0.0 + `@socket.io/redis-adapter` |
| **Realtime Engine** | Socket.io | v4.8.3 |
| **Structured Logging**| Winston | v3.19.0 (Daily rotating file + console JSON) |
| **Metrics** | Prometheus Client | `prom-client` v15.1.3 (Exposing `/metrics`) |
| **Validation** | Zod | v4.4.3 |

---

## 2. API Surface & Route Catalog

The backend exposes **20 route modules** under `/api/`:

| Module | Base Path | Key Endpoints | Auth Level | Rate Limited? |
|---|---|---|---|---|
| **Auth** | `/api/auth` | `/login`, `/register`, `/refresh`, `/me`, `/forgot-password` | Public / Token | Yes (Strict 5 req/min) |
| **Student** | `/api/student` | `/dashboard`, `/profile`, `/submissions`, `/courses`, `/stats` | Student | Yes |
| **Faculty** | `/api/faculty` | `/courses`, `/assignments`, `/students`, `/analytics`, `/grade` | Faculty | Yes |
| **Admin** | `/api/admin` | `/users`, `/courses`, `/analytics`, `/system-health`, `/audit-logs` | SuperAdmin / Admin | Yes |
| **Company** | `/api/placements`| `/jobs`, `/applicants`, `/shortlist`, `/interview-slots` | Company / Admin | Yes |
| **Tests** | `/api/tests` | `/all`, `/:id/start`, `/:id/submit`, `/:id/result` | Student / Faculty | Yes |
| **Mock Tests** | `/api/mock-tests`| `/list`, `/generate`, `/evaluate` | Student | Yes |
| **Problems** | `/api/problems` | `/list`, `/:id`, `/create`, `/update`, `/test-cases` | Student (Read), Faculty/Admin (Write) | Yes |
| **Judge** | `/api/judge` | `/run`, `/submit`, `/languages`, `/status/:token` | Authenticated | Yes (10 req/min) |
| **Exam Security** | `/api/exam-security`| `/violation`, `/snapshot`, `/session/:id/events`, `/report` | Student / Proctor | Yes |
| **Exam Recovery** | `/api/exam-recovery`| `/save-state`, `/recover-state`, `/heartbeat` | Student | Yes |
| **Live Classes** | `/api/live-classes`| `/rooms`, `/join`, `/signal`, `/end` | Faculty / Student | Yes |
| **Assignments** | `/api/assignments`| `/create`, `/submit`, `/review`, `/download-all` | Faculty / Student | Yes |
| **Content** | `/api/content` | `/upload`, `/resources`, `/media/:id` | Authenticated | Yes |
| **Academic** | `/api/academic` | `/semesters`, `/departments`, `/batches` | Admin / Faculty | Standard |
| **Communities** | `/api/communities`| `/threads`, `/replies`, `/upvote`, `/report` | Authenticated | Yes |
| **Permissions** | `/api/permissions`| `/roles`, `/assign`, `/verify` | Admin | Yes |
| **University** | `/api/university` | `/meta`, `/config`, `/branding` | Public / Admin | Standard |
| **Helpers / Util** | `/api/helpers` | `/time-sync`, `/network-ping`, `/version` | Public | Standard |
| **Observability** | `/metrics`, `/health`| System metrics, database ping, uptime | Internal / Public | Standard |

---

## 3. Middleware & Security Pipeline Audit

```
Incoming Request
      │
      ▼
1. CORS Middleware (Origin validation, Preflight OPTIONS handler)
      │
      ▼
2. Rate Limiting (IP + User ID Redis sliding window limiter)
      │
      ▼
3. Request ID & Correlation Tracer (UUID injected into req & res headers)
      │
      ▼
4. Body Parser & Size Limiter (Max 10MB for JSON / multipart uploads)
      │
      ▼
5. Authentication Middleware (`authMiddleware.js` - JWT decode & signature check)
      │
      ▼
6. Role-Based Access Control (RBAC - verifying user permissions)
      │
      ▼
7. Schema Validation (Zod schema validation against `req.body`, `req.query`, `req.params`)
      │
      ▼
8. Route Controller & Business Logic
      │
      ▼
9. Winston Logging & Prometheus Metrics Timer
      │
      ▼
10. Global Error Handler (Sanitizes stack traces, returns RFC 7807 problem details)
```

### 3.1 Rate Limiting Architecture (`rateLimiter.js`)
- **Design:** Dual-tier rate limiting (in-memory Map with auto-cleanup for standalone development; Redis-backed Token Bucket / Sliding Window in production).
- **Buckets:**
  - `authLimiter`: 5 attempts per 15 minutes per IP.
  - `judgeLimiter`: 10 code executions per minute per user.
  - `apiLimiter`: 100 general requests per minute.
- **Evaluation:** Robust defense against credential stuffing and Judge0 infrastructure exhaustion.

### 3.2 Authentication & Token Security (`authMiddleware.js`)
- Uses `crypto` or standard JWT library with HMAC-SHA256.
- Secret is validated on startup (`TOKEN_SECRET` minimum 32 characters required in production).
- Rejects expired, tampered, or missing authorization headers with clean `401 Unauthorized`.

---

## 4. Real-Time Infrastructure (Socket.io)

- **Namespace Architecture:**
  - `/proctoring`: Live video snapshot streaming, audio alert triggers, tab-switch notifications.
  - `/live-class`: WebRTC signaling channel, whiteboard data broadcast, chat messages.
  - `/notifications`: Live announcement toasts, grading alerts, system status.
- **Horizontal Scaling:** Configured with `@socket.io/redis-adapter` for multi-instance cluster deployments across container replicas.

---

## 5. Identified Risks & Architectural Defects

### Risk 1: In-Memory / File-based State Fallback (`db.json`)
- **Finding:** The backend contains a fallback mechanism to write to `backend/src/data/db.json` if PostgreSQL connection fails.
- **Impact:** In a multi-replica Docker setup (2+ backend containers), writing to a local `db.json` creates split-brain state where different requests see contradictory data.
- **Remediation:** Disable file-based fallback in `NODE_ENV=production`. If PostgreSQL is unreachable, fail fast and rely on container restart policies rather than creating desynchronized local JSON state.

### Risk 2: Unbounded S3 / Local File Uploads
- **Finding:** Upload endpoints for assignment submissions and video proctoring snapshots accept multipart form data.
- **Impact:** Potential disk exhaustion if local disk fallback is used without quotas.
- **Remediation:** Enforce S3/Cloudinary direct pre-signed URL uploads or strict 15MB file size limits with MIME-type magic-number validation (preventing polyglot executable uploads).

---

## 6. Recommendations & Action Items

1. **Strict Production DB Enforcement:** Throw a fatal exception on startup in production if `POSTGRES_URI` is missing or fails initial handshake.
2. **Standardize Async Handlers:** Wrap all route controller callbacks with a standardized `asyncHandler` to ensure uncaught promise rejections never trigger unhandled process crashes.
3. **Structured Logging Integration:** Ensure correlation ID (`x-request-id`) is propagated through all Winston log entries and downstream external service calls.
