# 09 — Performance & Capacity Report
**MujCode Platform — Load Test Results**

---

## Test Environment
- Platform: Windows 11 x64, local dev machine
- Node.js: v24.18.0
- Test Date: 2026-09-30
- Target: http://127.0.0.1:5000 (local backend)
- Tool: Custom Node.js load test scripts (load-tests/)
- Workers: 2 (WEB_CONCURRENCY=2, local low-memory mode)

---

## Important Caveats
1. All tests run on a LOCAL Windows development machine — NOT a production server
2. Results are NOT representative of cloud deployment performance
3. Rate limiter (300 req/min/user) causes many "failed" requests — these are by design
4. 10,000 RPS target cannot be assessed from a single Windows dev machine

---

## Measured Results

### Baseline Tests

| Scenario | Concurrent Users | RPS | p50 (ms) | p95 (ms) | p99 (ms) | Error % |
|----------|-----------------|-----|----------|----------|----------|---------|
| Baseline 1 | 1 | 64 | 0.75 | 6.66 | 9.50 | 49% (rate limited) |
| Baseline 5 | 5 | 311 | 0.70 | 10.15 | 15.21 | 45% (rate limited) |
| Baseline 10 | 10 | 563 | 0.97 | 12.71 | 17.97 | 43% (rate limited) |

### Load Tests

| Scenario | Concurrent Users | RPS | p50 (ms) | p95 (ms) | p99 (ms) | Max (ms) | Error % |
|----------|-----------------|-----|----------|----------|----------|---------|---------|
| Load 50 | 50 | 1,148 | 19.67 | 41.43 | 51.78 | 77.27 | 32% |
| Load 100 | 100 | **1,177** | 45.74 | 75.95 | 90.67 | 111.6 | 31% |
| Load 250 | 250 | 1,037 | 156.59 | 234.2 | 262.87 | 359.14 | 28% |
| Load 500 | 500 | 867 | 275.27 | 376.4 | 1,112.81 | 11,230 | 26% |

### Ramp-Up Test

| Concurrency | RPS | p50 (ms) | p99 (ms) | Error % |
|-------------|-----|----------|----------|---------|
| 25 | 759 | 7.47 | 29.47 | 20% |
| 50 | 1,066 | 17.24 | 48.4 | 22% |
| 100 | ~1,100 | ~40 | ~90 | 31% |

---

## Analysis

### Peak Throughput
- **Measured peak: 1,177 RPS @ 100 concurrent users (local Windows dev)**
- This is far below the 10,000 RPS aspirational target
- However, local Windows dev with 2 workers ≠ production

### Latency Profile
- At 100 users: p50=45ms, p95=75ms, p99=90ms — ACCEPTABLE for educational platform
- At 250 users: p50=157ms, p95=234ms — DEGRADED but functional
- At 500 users: p99=1,112ms — HIGH latency spike at tail end

### Error Analysis
- Most "failures" are HTTP 429 (rate limited) — expected and correct behavior
- At 500 users: 99 HTTP 500 errors and 36 ECONNREFUSED errors — concerning at this scale
- ECONNREFUSED indicates connection pool exhaustion

### Primary Bottlenecks (Identified)
1. Rate limiter triggers aggressively at high concurrency (design choice)
2. PostgreSQL pool exhaustion at 500+ concurrent users (pool max=5 per worker)
3. Windows dev machine I/O limits (not representative of Linux server)
4. Only 2 workers on low-memory detection

---

## 10,000 RPS Target Assessment

**VERDICT: NOT DEMONSTRABLE on current infrastructure**

### What is needed for 10,000 RPS:
- Multi-core Ubuntu server (8+ cores)
- PostgreSQL pool max of 20+ per worker
- Redis with sub-millisecond latency (not localhost)
- 4-8 backend replicas (docker compose --scale backend=8)
- Nginx with upstream keepalive 256+

### Realistic capacity (production Ubuntu VPS, 4 cores, 8 GB RAM):
- Estimated sustainable: 3,000-5,000 RPS for read-heavy API traffic
- With horizontal scaling (3 Render instances): 8,000-12,000 RPS possible
- Requires: Load balancing + Redis adapter for Socket.IO

---

## Initial Memory Footprint
```
RSS: 66.7 MB
Heap Used: 7.81 MB
Heap Total: 12.48 MB
```
Very lean startup — custom HTTP server (no framework bloat) shows results.

---

## Recommendations

1. Increase POSTGRES_POOL_MAX to 10-15 for production (currently 5)
2. Run 4 workers minimum in production (WEB_CONCURRENCY=4)
3. Run load tests on Ubuntu VPS before production claims
4. Consider Redis connection pooling for rate limiter keys
5. Monitor p99 latency — spikes at 500 users suggest connection queue buildup
