# MujCode Platform — Disaster Recovery & Backup Runbook

**Document Version:** 1.0.0  
**Effective Date:** October 15, 2026  
**Target RPO (Recovery Point Objective):** < 1 Hour  
**Target RTO (Recovery Time Objective):** < 30 Minutes  

---

## 1. Data Store Classification & Backup Schedule

| Component | Storage Provider | Backup Frequency | Retention Policy | Storage Target & Encryption |
|---|---|---|---|---|
| **Primary Relational DB** | Neon.tech PostgreSQL | Continuous WAL Archiving + Point-in-Time Recovery (PITR) | 30 Days continuous rollback | Neon cloud tier (AES-256 encrypted) |
| **Secondary Relational Snapshot** | Self-hosted `pg_dump` | Daily at 02:00 UTC (Automated Cron) | 90 Days grandfather-father-son | AWS S3 Bucket / Wasabi (KMS encrypted) |
| **Placement Drives & ATS** | MongoDB Atlas M0/M10 | Automated Daily Snapshot | 7 Days Rolling | Atlas Encrypted Storage |
| **Cache & Real-Time Queues** | Upstash Redis | Hourly snapshot (AOF everysec active) | Ephemeral / Reconstructable | Distributed multi-AZ replica |
| **Student Resumes & Documents** | Cloudinary / S3 | Immutable Object Storage with Versioning | Indefinite / Academic lifecycle | Multi-region redundant cloud storage |

---

## 2. Emergency Recovery Procedures

### 2.1 Scenario A: PostgreSQL Data Corruption or Accidental Table Drop
1. **Initiate Neon Point-in-Time Recovery (PITR):**
   - Access Neon Console → **Branches** → **Restore to point in time**.
   - Select timestamp 5 minutes prior to the corruption incident.
   - Set restored branch as `primary`.
   - Update `POSTGRES_URI` in Render/production environment variables.
2. **Execute Schema & Data Verification:**
   ```bash
   node backend/src/scripts/verify_backup_restore.js --target=$NEW_POSTGRES_URI
   ```

### 2.2 Scenario B: Full Disaster Recovery from Cold `pg_dump`
1. **Provision New PostgreSQL Instance (Neon or AWS RDS):**
   ```bash
   createdb -h new-db-host -U postgres mujcode_db
   ```
2. **Restore Encrypted Backup Archive:**
   ```bash
   pg_restore -h new-db-host -U postgres -d mujcode_db -v -c mujcode_backup_latest.dump
   ```
3. **Run Application Reconciliation Suite:**
   ```bash
   node backend/src/scripts/migrateToPostgres.js
   ```

---

## 3. Automated Monthly Restoration Drill Runbook

To satisfy production compliance, a restoration drill must be executed monthly:
1. Spin up a temporary disposable PostgreSQL database.
2. Restore the latest backup archive into the disposable database.
3. Verify row counts and foreign key integrity across:
   - `users`
   - `students`
   - `faculty`
   - `tests`
   - `testSubmissions`
   - `assignments`
   - `assignmentSubmissions`
4. Confirm application smoke test passes against disposable database.
5. Tear down disposable database and record evidence in audit logs.
