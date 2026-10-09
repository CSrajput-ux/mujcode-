# 07 — Disaster Recovery & Rollback Procedures
**MujCode Platform — Database Preservation, Integrity Checks & Service Rollback**

---

## 1. Automated PostgreSQL Backup for Judge0

```bash
#!/bin/bash
set -euo pipefail
BACKUP_DIR="/var/backups/judge0"
mkdir -p "${BACKUP_DIR}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/judge0_db_${TIMESTAMP}.sql.gz"

docker compose -f judge0/docker-compose.yml exec -T db pg_dump -U judge0 judge0 | gzip -9 > "${BACKUP_FILE}"
sha256sum "${BACKUP_FILE}" > "${BACKUP_FILE}.sha256"
echo "Backup created successfully: ${BACKUP_FILE}"
```

---

## 2. Safe Restoration Drill (Non-Destructive Isolated DB)

To test backup integrity without affecting the active Judge0 service:
```bash
# 1. Take backup with SHA-256 verification
docker exec judge0_db pg_dump -U judge0 -d judge0 -F c -f /tmp/judge0_backup.dump
docker exec judge0_db sha256sum /tmp/judge0_backup.dump

# 2. Create isolated disposable database
docker exec judge0_db createdb -U judge0 judge0_restore_drill

# 3. Restore dump into isolated database
docker exec judge0_db pg_restore -U judge0 -d judge0_restore_drill /tmp/judge0_backup.dump

# 4. Verify table count and record counts match primary
docker exec judge0_db psql -U judge0 -d judge0_restore_drill -c "\dt"
docker exec judge0_db psql -U judge0 -d judge0_restore_drill -c "SELECT count(*) FROM submissions;"
docker exec judge0_db psql -U judge0 -d judge0 -c "SELECT count(*) FROM submissions;"

# 5. Clean up drill database and temporary archive
docker exec judge0_db dropdb -U judge0 judge0_restore_drill
docker exec judge0_db rm -f /tmp/judge0_backup.dump
```

---

## 3. Full Disaster Recovery Restoration

In the event of complete data loss or host reconstruction:
```bash
# 1. Stop Judge0 server & workers to prevent writes
docker compose -f judge0/docker-compose.yml stop server workers

# 2. Re-create clean database
docker compose -f judge0/docker-compose.yml exec -T db dropdb -U judge0 judge0
docker compose -f judge0/docker-compose.yml exec -T db createdb -U judge0 judge0

# 3. Restore from archive
gunzip -c /var/backups/judge0/judge0_db_latest.sql.gz | docker compose -f judge0/docker-compose.yml exec -T db psql -U judge0 judge0

# 4. Restart stack and verify health
docker compose -f judge0/docker-compose.yml start server workers
curl -s http://127.0.0.1:2358/system_info
```


---

## 3. Version Rollback Procedure

To roll back to a prior verified Judge0 version:
```bash
# 1. Revert image tag in judge0/docker-compose.yml
# 2. Pull and restart
docker compose -f judge0/docker-compose.yml up -d --force-recreate
```
