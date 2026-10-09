# 20 — Backup, Disaster Recovery & Data Preservation Verification
**MujCode Platform — Persistence Inventory, Recovery Objectives & Data Protection Standards**

---

## 1. Persistent Data Stores Inventory

The platform relies on four classes of stateful data that require distinct protection strategies:

| Data Class | Storage Location | Irreplaceable Data Elements | Authoritative Store |
|---|---|---|---|
| **Relational Core Data** | PostgreSQL (Neon / Local PG) | Student records, exam submissions, grades, questions, job applications, user credentials | PostgreSQL (`mujcode_db`) |
| **Object & File Uploads** | Cloudinary / AWS S3 / Local `/uploads` | Student assignment submissions, proctoring webcam snapshots, resume PDFs | Cloud Object Storage / Disk Volume |
| **Document State (ATS)** | MongoDB (Atlas / Container) | Parsed resume entities, ATS candidate profiles, historical execution runs | MongoDB (`mujcode_ats`) |
| **Ephemeral Cache State**| Redis / In-Memory Store | Rate limit counters, active JTI token blocklist, live job queue polling status | Redis (Ephemeral) |

---

## 2. Backup Mechanisms & Recovery Objectives (RPO / RTO)

| Data Store | Backup Mechanism | Target RPO (Max Data Loss) | Target RTO (Max Downtime) | Verification Status |
|---|---|---|---|---|
| **PostgreSQL (Neon Cloud)** | Automated continuous WAL archiving + hourly snapshot rollbacks | < 5 minutes | < 15 minutes | **VERIFIED SUPPORTED** |
| **PostgreSQL (Self-Hosted)** | Nightly `pg_dump` script + gzip compression to S3 | < 24 hours (Daily) | < 30 minutes | **SCRIPT READY** |
| **Uploaded Files (S3)** | AWS S3 Bucket Versioning + Cross-Region Replication (CRR) | < 1 minute | < 5 minutes | **VERIFIED SUPPORTED** |
| **Uploaded Files (Local)** | Docker named volume `backend_uploads` snapshot / backup | < 24 hours | < 30 minutes | **VOLUME CONFIGURED** |
| **Local Snapshot Files** | Background worker thread atomic writes (`db.json`) | < 100ms | Instant (Local file) | **VERIFIED ACTIVE** |

---

## 3. Step-by-Step Restoration & Recovery Procedures

### 3.1 PostgreSQL Database Restoration Drill
To restore from a `pg_dump` backup file:
```bash
# 1. Stop backend services to prevent partial writes
docker compose stop backend

# 2. Drop corrupted database and recreate clean target
docker compose exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS mujcode_db;"
docker compose exec -T postgres psql -U postgres -c "CREATE DATABASE mujcode_db;"

# 3. Restore schema, tables, indexes and collections from archive
gunzip -c /backups/mujcode_db_backup_20261010.sql.gz | docker compose exec -T postgres psql -U postgres -d mujcode_db

# 4. Run automated integrity reconciliation query
docker compose run --rm backend node -e "import('./src/lib/postgres.js').then(m => m.auditDatabaseIntegrity().then(console.log))"

# 5. Restart backend services
docker compose start backend
```

### 3.2 Cold Emergency Start from Local Snapshot Files
If PostgreSQL is permanently lost and must be rebuilt from local file snapshots:
```bash
# Initialize a new PostgreSQL database and auto-migrate from db.json
docker compose run --rm backend node src/scripts/migrateToPostgres.js
```

---

## 4. Verification & Readiness Assessment

1. **Automated Schema Provisioning:** Verified that `initPostgres()` automatically creates all required tables, indexes, and unique constraints on a clean database.
2. **Auto-Seed Fallback:** Verified that if a fresh PostgreSQL database is connected, it safely auto-seeds from `db.json` without data corruption.
3. **Data Loss Safeguards:** Verified that transactional relational tables (`applications`, `test_submissions`) are excluded from bulk JSON overwrites.

---

## 5. Summary Findings & Action Items

| Finding ID | Severity | Status | Action Item |
|---|---|---|---|
| **BCK-01** | Medium | **RECOMMENDATION** | Schedule a daily automated cron job running `pg_dump` with direct off-site upload to an encrypted AWS S3 bucket. |
| **BCK-02** | Low | **RECOMMENDATION** | Conduct a quarterly dry-run disaster recovery restoration test in a staging environment. |
