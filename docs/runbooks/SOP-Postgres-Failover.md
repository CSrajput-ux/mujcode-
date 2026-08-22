# SOP: PostgreSQL Failover

**Severity**: Critical
**Symptoms**: 
- Backend API pods are crashing with `ECONNREFUSED` or timeout errors.
- AWS RDS Dashboard shows the primary `mujcode_db` instance is in a "Failed" or "Rebooting" state.
- Grafana `http_request_duration_ms` spikes to > 10,000ms.

## Diagnosis
1. Verify the exact state of the AWS RDS instance via the AWS Console or CLI:
   ```bash
   aws rds describe-db-instances --db-instance-identifier mujcode-db-prod
   ```
2. Check if Multi-AZ automatic failover is already in progress. If so, wait 60-120 seconds. RDS handles DNS updates automatically.

## Resolution Steps
1. **Manual Promotion (If Automatic Fails)**: If the primary is completely dead and automatic failover didn't trigger, manually promote the read replica.
   ```bash
   aws rds promote-read-replica --db-instance-identifier mujcode-db-prod-replica
   ```
2. **Update Secrets**: Once the replica is promoted, it becomes a standalone primary DB. Update the Kubernetes Secret with the new endpoint:
   ```bash
   kubectl edit secret mujcode-secrets -n production
   # Update POSTGRES_URI to the new endpoint
   ```
3. **Restart API Pods**: Force the backend pods to reconnect to the new database immediately.
   ```bash
   kubectl rollout restart deployment mujcode-backend -n production
   ```
4. **Data Integrity Check**: Verify the latest transaction timestamps in the `users` and `jobs` tables to identify any data loss window.
