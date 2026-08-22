# SOP: Compiler Cluster Deadlock

**Severity**: High
**Symptoms**: 
- Queue depth in Grafana exceeds 1,000 for > 5 minutes.
- Redis Stream `compiler:jobs` is filling up but consumer group `compiler_group` is stuck.
- Compiler Worker pods are at 100% CPU but processing 0 jobs/sec.

## Diagnosis
1. Check Prometheus metrics for `execution_queue_depth`.
2. Inspect worker logs in Loki: `kubectl logs -l app=compiler-worker -n production --tail=100`. Look for `SIGKILL` or memory exhaustion errors (`OOMKilled`).

## Resolution Steps
1. **Purge the Workers**: The quickest way to resolve a zombie worker deadlock is a rolling restart.
   ```bash
   kubectl rollout restart deployment mujcode-compiler-worker -n production
   ```
2. **Clear Poison Pills**: If a specific malformed code submission is crashing the workers, inspect the pending Redis messages.
   ```bash
   redis-cli -u $REDIS_URI XPENDING compiler:jobs compiler_group
   ```
   If a specific message ID has been retried > 5 times, drop it:
   ```bash
   redis-cli -u $REDIS_URI XACK compiler:jobs compiler_group <message-id>
   ```
3. **Scale Up Interventions**: If it's a genuine traffic spike, temporarily override the HPA max limit to 50:
   ```bash
   kubectl scale hpa mujcode-compiler-worker-hpa -n production --max=50
   ```
