# 19 — Distributed State, Clustering & Failover Audit
**MujCode Platform — Multi-Worker Behavior, Redis State Sharing & Resiliency Evaluation**

---

## 1. Multi-Worker & Distributed Topology Analysis

When running in cluster mode (or multi-replica container deployments), state is shared across four channels:

```
┌────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                  │
│       (Authoritative Persistent State & Relational)     │
└───────────▲────────────────────────────────▲───────────┘
            │                                │
┌───────────┴──────────┐          ┌──────────┴──────────┐
│   Backend Worker 1   │          │   Backend Worker 2   │
│ ┌──────────────────┐ │          │ ┌──────────────────┐ │
│ │  dbCache Memory  │ │◄───IPC──►│ │  dbCache Memory  │ │
│ └──────────────────┘ │ (Sync)   │ └──────────────────┘ │
│ ┌──────────────────┐ │          │ ┌──────────────────┐ │
│ │  Socket.IO Node  │ │          │ │  Socket.IO Node  │ │
│ └─────────┬────────┘ │          │ └─────────┬────────┘ │
└───────────┼──────────┘          └───────────┼──────────┘
            │                                 │
            ▼                                 ▼
┌────────────────────────────────────────────────────────┐
│                   Redis Cluster / Instance              │
│  - Token Revocation Blocklist (token:revoked:jti)       │
│  - Distributed Rate Limiter (ratelimit:*)              │
│  - Asynchronous Job Queue State (job:job_xxx)          │
│  - Socket.IO Pub/Sub Adapter (Cross-Node Broadcast)     │
└────────────────────────────────────────────────────────┘
```

---

## 2. Distributed State Verification Matrix

| State Component | Distributed Mechanism | Behavior with Redis Healthy | Behavior when Redis Fails / Unset |
|---|---|---|---|
| **Token Revocation (JTI)** | Redis key `token:revoked:${jti}` with TTL | Revocation is instantaneous across all workers | Falls back to worker-local memory Map (revocation affects current worker immediately; sibling workers reject upon token expiry) |
| **Rate Limiting** | Redis atomic pipeline (`INCR` + `EXPIRE NX`) | Globally shared rate limits across all cluster workers | Falls back to worker-local Map (limits become per-worker rather than cluster-wide) |
| **Job Queue State** | Redis `job:${jobId}` JSON with 1h TTL | Any worker can serve polling status for any job | Worker that executed the job has the status; cross-worker polling returns 404 if sticky sessions are not configured |
| **Socket.IO Real-time** | `@socket.io/redis-adapter` Pub/Sub | Real-time events broadcast across all worker instances | Falls back to in-memory adapter (events broadcast only to clients connected to the same worker process) |
| **In-Memory Collections** | Node.js Primary IPC Broker (`CACHE_SYNC`) | IPC relays collection mutations to all sibling workers | Continues working normally (IPC is independent of Redis) |

---

## 3. Failover & Transient Fault Analysis

### Scenario A: Remote Redis Connection Drop
- **Code Path (`src/config/redis.js:152-187`):**
  - All Redis operations are wrapped in pre-bound method dispatchers that check `_client._healthy`.
  - If Redis disconnects or errors, methods automatically redirect calls to `InMemoryFallbackRedis` without throwing uncaught exceptions.
- **Verdict:** **PASS (Resilient Fallback)**. Application continues serving traffic with graceful feature degradation.

### Scenario B: Cluster Worker Process Crash
- **Code Path (`src/server.js:39-59`):**
  - Primary process catches `cluster.on('exit')`.
  - Sibling workers continue serving traffic with zero interruption.
  - Primary forks a fresh replacement worker after a 1,000ms delay.
  - Crash-loop detector prevents infinite CPU spin if 5 crashes occur within 5 seconds.
- **Verdict:** **PASS (Self-Healing)**.

### Scenario C: Transient Database Network Partition
- **Code Path (`src/server.js:94-126`):**
  - Process-level exception guards intercept transient network errors (`ECONNRESET`, `ETIMEDOUT`, `Connection terminated`, `Channel closed`).
  - Guards prevent process termination, allowing the PostgreSQL connection pool to automatically re-establish healthy socket connections.
- **Verdict:** **PASS (Crash-Proof Handlers)**.

---

## 4. Distributed State Recommendations

1. **Sticky Sessions on Load Balancer:** When deploying multi-replica containers behind Nginx or AWS ALB, enable cookie-based sticky sessions (`ip_hash` in Nginx or session affinity in Render/Kubernetes) to ensure Socket.io polling and in-memory fallback polling consistently route to the correct container.
2. **Redis Cloud Sentinel / Cluster:** In high-availability production environments, provision managed Redis (Upstash / AWS ElastiCache / Redis Cloud) with automatic failover.
