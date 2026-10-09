# 06 — Operations, Observability & Incident Response
**MujCode Platform — Judge0 Health Checks, Logging & Queue Monitoring**

---

## 1. Health & Status Verification Commands

```bash
# 1. Check all Judge0 container health statuses
docker compose -f judge0/docker-compose.yml ps

# 2. Check API gateway system info (HTTP 200 JSON with host CPU, cores, memory)
curl -s http://127.0.0.1:2358/system_info | jq .

# 3. Check PostgreSQL database health
docker exec judge0_db pg_isready -U judge0 -d judge0

# 4. Check Redis server health
docker exec judge0_redis redis-cli -a "$REDIS_PASSWORD" ping

# 5. Check live queue backlog in Redis (Judge0 uses Resque; active queue key is resque:queue:1.13.1)
docker exec judge0_redis redis-cli -a "$REDIS_PASSWORD" LLEN resque:queue:1.13.1

# 6. Check total jobs processed by Resque workers
docker exec judge0_redis redis-cli -a "$REDIS_PASSWORD" GET resque:stat:processed

# 7. Check active registered worker instances in Redis
docker exec judge0_redis redis-cli -a "$REDIS_PASSWORD" SMEMBERS resque:workers

# 8. Check active worker process logs
docker compose -f judge0/docker-compose.yml logs -f --tail=50 workers
```

---

## 2. Log Inspection & Troubleshooting

- **Worker Errors / Sandbox Failures:**
  ```bash
  docker compose -f judge0/docker-compose.yml logs --tail=100 workers | grep -E "ERROR|WARN"
  ```
- **Stuck Submissions in Queue / Burst Traffic:**
  If the Resque queue grows unexpectedly, scale workers dynamically:
  ```bash
  docker compose -f judge0/docker-compose.yml up -d --scale workers=6
  ```
- **Disk Space Pressure:**
  Clean unused execution temporary files safely without removing persistent volumes:
  ```bash
  docker system prune -f
  ```

