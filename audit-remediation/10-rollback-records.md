# 10 — Rollback & Emergency Runbooks
**MujCode Platform — Disaster Recovery, Rollback Triggers & Operational Procedures**

---

## 1. Rollback Triggers & Automated Thresholds

Initiate immediate release rollback if any of the following conditions occur post-deployment:
- HTTP 5xx error rate exceeds **1.5%** over a 5-minute rolling window.
- Database connection acquisition timeouts exceed **5,000ms** for consecutive requests.
- Compiler execution failure rate exceeds **5%** for standard Python/C++ test runs.
- Unhandled cluster worker crash loops trigger primary process exit.

---

## 2. Rollback Execution Procedures

### 2.1 Rolling Container Rollback (Docker Compose / PaaS)
```bash
# 1. Switch traffic to previous stable image tag
docker compose pull backend:stable

# 2. Restart backend replicas gracefully
docker compose up -d --no-deps --scale backend=2 backend

# 3. Verify health endpoint
curl -f http://127.0.0.1:5000/health
```

### 2.2 Database Schema Reversion Drill
If a newly applied schema migration requires rollback:
```bash
# Execute rollback migration script
node src/scripts/rollbackMigration.js

# Re-validate data integrity
node -e "import('./src/lib/postgres.js').then(m => m.auditDatabaseIntegrity().then(console.log))"
```
