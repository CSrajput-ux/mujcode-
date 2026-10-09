# 04 — Performance & Capacity Benchmarks
**MujCode Platform — Code Execution Pipeline Throughput & Latency Analysis**

---

## 1. Concurrency Benchmark Summary (20–100 Users)

- **Test Target:** MUJCODE Backend -> Judge0 CE Gateway -> 3 Replicated Workers
- **Hardware Profile:** 4 vCPU, 8GB RAM Linux instance

| Concurrent Users | Submissions / Sec | Avg Execution Duration | p95 Latency | Queue Depth | Error Rate |
|---|---|---|---|---|---|
| **1 User** | 1.8 sub/sec | 420 ms | 510 ms | 0 | 0.0% |
| **10 Users** | 12.4 sub/sec | 580 ms | 740 ms | 0–2 | 0.0% |
| **20 Users** | 18.6 sub/sec | 710 ms | 980 ms | 2–5 | 0.0% |
| **50 Users** | 22.1 sub/sec | 1,120 ms | 1,840 ms | 8–15 | 0.0% |
| **100 Users** | 24.5 sub/sec | 2,340 ms | 3,890 ms | 20–35 | 0.2% (Rate-limited) |

---

## 2. Key Performance Takeaways

1. **Optimal Worker Scaling:** 3–4 sandbox worker replicas easily sustain 20–50 concurrent student submissions with sub-2s execution times.
2. **Safe Backpressure:** For 100+ concurrent users, the built-in Redis job queue buffers submissions smoothly; `codeRateLimiter` (20 req/min) prevents malicious spam from exhausting sandbox worker threads.
