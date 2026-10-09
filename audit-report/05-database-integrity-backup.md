# 05 — Database Integrity & Backup
**MujCode Platform — Data Layer Assessment**

---

## Data Stores Identified

| Store | Type | Location | Role |
|-------|------|----------|------|
| PostgreSQL (Neon) | Primary RDBMS | Cloud (us-east-2) | All core data |
| Redis (Upstash/local) | Cache + Queue | Cloud/local | Sessions, rate limits, jobs |
| MongoDB Atlas | Document DB | Cloud | ATS/Placement module only |
| db.json | JSON flat file | backend/src/data/db.json | Fallback + JSON cache layer |
| students.json | JSON flat file | backend/src/data/students.json | Student data snapshot |
| faculty.json | JSON flat file | backend/src/data/faculty.json | Faculty data snapshot |

---

## PostgreSQL Schema

Tables created automatically at startup (initPostgres):

| Table | Primary Key | Unique Constraint | Indexes |
|-------|-------------|------------------|---------|
| mujcode_collections | collection_name (VARCHAR 100) | collection_name | idx_mujcode_collections_name |
| faculty | id (VARCHAR 100) | id | none |
| problems | id (VARCHAR 100) | id | none |
| users | id (VARCHAR 100) | id | none |
| students | id (VARCHAR 100) | id | none |
| applications | SERIAL | (student_id, job_id) | idx_applications_student_id, idx_applications_job_id |
| test_submissions | id (VARCHAR 100) | (test_id, student_id) | idx_test_submissions_test_id, idx_test_submissions_student_id |

### Schema Issues Found

1. ISSUE: mujcode_collections stores JSONB blobs per collection — this is a document-store pattern on a relational DB. Performance degrades at scale with large JSONB blobs.
   - Risk: MEDIUM — acceptable for current scale (<1000 concurrent users)

2. ISSUE: faculty, problems, users, students tables have no foreign key relationships — they are denormalized mirrors of JSONB data.
   - Risk: LOW — these are secondary indices, not authoritative

3. GOOD: applications table has proper UNIQUE constraint (student_id, job_id) — prevents duplicate applications atomically

4. GOOD: test_submissions has proper UNIQUE constraint (test_id, student_id)

---

## Data Integrity Audit Endpoint

`GET /api/system/reconciliation` (admin only) runs:
```sql
-- Check for duplicate applications
SELECT student_id, job_id, count(*) as count
FROM applications GROUP BY student_id, job_id HAVING count(*) > 1;

-- Check for null/invalid applications
SELECT count(*) FROM applications WHERE student_id IS NULL OR job_id IS NULL OR status IS NULL;

-- Check for duplicate submissions
SELECT test_id, student_id, count(*) FROM test_submissions GROUP BY test_id, student_id HAVING count(*) > 1;
```

Status: PASS (structure verified through code review)

---

## Dual Source-of-Truth Risk Analysis

### Problem
When PostgreSQL is available:
- All writes go to in-memory cache → debounced to PostgreSQL (100ms)
- Reads come from in-memory cache (0ms latency)

When PostgreSQL is unavailable:
- App falls back to reading from db.json (stale snapshot)
- Writes still succeed to in-memory cache
- On restart, stale db.json is loaded — **PostgreSQL changes since last sync are LOST**

### Risk Assessment: HIGH
- Silent fallback with no admin notification
- In a multi-worker setup, each worker loads its own stale snapshot on fallback
- Data written during PostgreSQL outage may be partially lost on restart

### Mitigation in Code
```js
// storage.js line 94
logger.warn('[StorageEngine] Failed to load from PostgreSQL. Falling back to disk.');
```
The warning exists but uses `warn` level — should be `error` or `alert`.

---

## Backup Assessment

### Current Status: NO BACKUP PROCEDURE EXISTS — FAIL

**Neon.tech Free Tier:**
- Point-in-time restore: NOT available (Pro plan only)
- Export: Manual pg_dump possible
- Retention: 7 days on Pro, NONE on Free

**Recommended Backup Strategy:**

**Daily automated backup:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M)
pg_dump $POSTGRES_URI | gzip > mujcode_backup_${DATE}.sql.gz
# Upload to Cloudinary or AWS S3
```

**Schedule:**
- Daily full backup: 2:00 AM IST
- Retain: 30 days (daily), 12 months (monthly)
- Alert: Email on backup failure

**RPO (Recovery Point Objective):**
- Current: UNDEFINED (no backups)
- Target: 24 hours with daily backups
- Better: 1 hour with Neon Pro PITR

**RTO (Recovery Time Objective):**
- Current: UNDEFINED
- Target: < 2 hours (restore from pg_dump)
- Better: < 15 minutes with Neon branch restore

---

## Backup Restoration Test: BLOCKED

Cannot perform backup restoration verification because:
1. No backup files exist
2. Neon free tier does not support PITR
3. Disposable test database creation requires paid Neon plan or local PostgreSQL

**Instructions to perform restoration test:**
```bash
# 1. Create backup
pg_dump $POSTGRES_URI > backup.sql

# 2. Create disposable test DB (Neon branch or local)
createdb mujcode_test

# 3. Restore
psql mujcode_test < backup.sql

# 4. Verify
psql mujcode_test -c "SELECT count(*) FROM mujcode_collections;"
psql mujcode_test -c "SELECT count(*) FROM applications;"
psql mujcode_test -c "SELECT count(*) FROM test_submissions;"
```
