# 14 — Backup & Recovery Runbook
**MujCode Platform — Operational Procedures**

---

## Backup Schedule

| Frequency | Type | Retention | Method |
|-----------|------|-----------|--------|
| Daily (2 AM IST) | Full pg_dump | 30 days | Automated script |
| Weekly (Sunday 3 AM) | Full pg_dump | 6 months | Automated script |
| Monthly (1st, 4 AM) | Full pg_dump | 1 year | Automated script |
| On-demand | Pre-deploy | 7 days | Manual |

---

## Backup Script

```bash
#!/bin/bash
# File: scripts/backup.sh
set -euo pipefail

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="mujcode_backup_${DATE}.sql.gz"
LOG_FILE="/var/log/mujcode_backup.log"

echo "[$(date)] Starting backup..." >> $LOG_FILE

# Create compressed backup
pg_dump "$POSTGRES_URI" | gzip > "/tmp/${BACKUP_FILE}"

# Upload to Cloudinary (using cloudinary CLI or curl)
curl -X POST "https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload" \
  -u "${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}" \
  -F "file=@/tmp/${BACKUP_FILE}" \
  -F "folder=mujcode-backups" \
  -F "public_id=${BACKUP_FILE}"

echo "[$(date)] Backup completed: ${BACKUP_FILE}" >> $LOG_FILE

# Cleanup temp file
rm -f "/tmp/${BACKUP_FILE}"
```

## Cron Setup
```bash
# Add to crontab (crontab -e)
0 2 * * * /opt/mujcode/scripts/backup.sh   # Daily at 2 AM
0 3 * * 0 /opt/mujcode/scripts/backup.sh   # Weekly Sunday
0 4 1 * * /opt/mujcode/scripts/backup.sh   # Monthly 1st
```

---

## Restoration Procedure

### Step 1: Download backup
```bash
# From Cloudinary
curl -o backup.sql.gz "https://res.cloudinary.com/z7hnbq1b/raw/upload/mujcode-backups/mujcode_backup_YYYYMMDD.sql.gz"
gunzip backup.sql.gz
```

### Step 2: Create disposable test database (verify first)
```bash
# Create Neon branch for testing
# OR use local PostgreSQL
createdb mujcode_restore_test
psql mujcode_restore_test < backup.sql
```

### Step 3: Verify restoration
```bash
psql mujcode_restore_test << EOF
SELECT count(*) as collections FROM mujcode_collections;
SELECT count(*) as applications FROM applications;
SELECT count(*) as submissions FROM test_submissions;
SELECT count(*) as students FROM students;
EOF
```

### Step 4: Point application to restored DB (production)
```bash
# Update POSTGRES_URI in .env to restored database
POSTGRES_URI=postgresql://user:pass@restored-host/mujcode_db
docker compose restart backend
```

### Step 5: Verify application health
```bash
curl http://localhost:5000/
curl http://localhost:5000/api/system/reconciliation  # Admin token required
```

---

## Disaster Scenarios

### Scenario 1: Neon DB paused (free tier)
- Impact: Application falls back to stale db.json — data corruption risk
- Action: Upgrade Neon plan → wake up project → verify data integrity
- RTO: 30 minutes | RPO: Last sync time

### Scenario 2: Accidental data deletion
- Impact: Records deleted from PostgreSQL
- Action: Restore from most recent daily backup to new Neon branch
- RTO: 1-2 hours | RPO: Up to 24 hours

### Scenario 3: Credential compromise
- Action: 
  1. Rotate all DB passwords immediately
  2. Invalidate all JWT tokens (rotate TOKEN_SECRET)
  3. Force all users to re-login
  4. Audit logs for unauthorized access
- RTO: 2 hours (rotating credentials + restart)

### Scenario 4: Complete server failure
- Action:
  1. Provision new server
  2. Deploy Docker stack
  3. Point to existing Neon DB (data is in cloud)
  4. Restore Redis state from backup if needed
- RTO: 1-2 hours | RPO: 0 (PostgreSQL data is in Neon cloud)

---

## Recovery Verification Checklist

After any restoration:
- [ ] All mujcode_collections rows present
- [ ] Student count matches expected (check with admin dashboard)
- [ ] Test submissions accessible
- [ ] Application records for recent placement drives present
- [ ] Login works for known test accounts
- [ ] Code execution works (test with simple Python program)
- [ ] No data integrity violations: GET /api/system/reconciliation → "100% CLEAN"
