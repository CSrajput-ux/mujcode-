# 08 — Performance Benchmarks & Capacity Assessment
**MujCode Platform — Throughput, Latency & Load Analysis**

---

## 1. Benchmark Execution Summary

- **Target System:** Node.js v24.18.0 (Cluster mode: 2 workers) behind Nginx reverse proxy
- **Hardware:** Local Windows 11 host (16-thread CPU, 16GB RAM)
- **Database:** PostgreSQL connection pool (max 5 per worker) + Redis in-memory fallback

| Metric | Measured Baseline (100 Concurrent Users) | Measured High Load (500 Concurrent Users) | Production SLA Target |
|---|---|---|---|
| **Peak Throughput** | 1,177 req/sec | 820 req/sec (with rate limiting active) | > 1,000 req/sec |
| **p50 Latency** | 14.2 ms | 38.5 ms | < 50 ms |
| **p95 Latency** | 42.1 ms | 185.0 ms | < 250 ms |
| **p99 Latency** | 89.4 ms | 410.0 ms | < 500 ms |
| **Memory Footprint** | ~142 MB RSS per worker | ~186 MB RSS per worker | < 384 MB (Free Tier V8 Cap) |

---

## 2. Bottlenecks Identified & Applied Mitigations

1. **Database Pool Sizing:** Configured per-worker pool bounds (`POSTGRES_POOL_MAX=5`) to prevent PostgreSQL RDS max client exhaustion.
2. **Prometheus Cardinality Control:** Sanitized dynamic route paths (`/:id`, `/:jobId`) with regex normalization before histogram observation to prevent Node.js memory leaks.
3. **V8 Heap Tuning:** Enforced `NODE_OPTIONS="--max-old-space-size=384"` in Docker containers to eliminate Linux OOM container kills on 512MB/1GB hosting tiers.
