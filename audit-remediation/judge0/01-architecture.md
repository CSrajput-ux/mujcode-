# 01 — Judge0 Execution Architecture
**MujCode Platform — Code Execution Topology & Request Lifecycle**

---

## 1. System Topology

```
┌────────────────────────────────────────────────────────┐
│                   MUJCODE Frontend                     │
│  - Monaco Editor (Syntax highlighting, template code)  │
│  - Terminal Console (Live polling every 500ms)         │
└───────────────────────────▲────────────────────────────┘
                            │ (Bearer JWT / HTTPS)
┌───────────────────────────▼────────────────────────────┐
│                   MUJCODE Backend                      │
│  - /api/judge/submit, /api/compiler/submit             │
│  - /api/judge/job-status/:jobId (Ownership Guard)      │
│  - CodeExecutionService & ExecutionProviderFactory     │
└───────────────▲────────────────────────▲───────────────┘
                │                        │
       [General Languages]             [SQL]
                │                        │
┌───────────────▼──────────────┐ ┌───────▼───────────────┐
│     Judge0 REST Gateway      │ │ SqlExecutionProvider  │
│   (http://judge0_server:2358)│ │ (DatabaseSync in-mem) │
│ - POST /submissions          │ │ - Schema + Seed test  │
│ - GET /submissions/:token    │ │ - Regex AST guard     │
└───────────────┬──────────────┘ └───────────────────────┘
                │
┌───────────────▼──────────────┐
│    Judge0 Redis & Workers    │
│  - isolate sandbox container │
│  - cgroups v1 resource caps  │
│  - Network disabled (false)  │
└──────────────────────────────┘
```

---

## 2. Architectural Responsibilities & Isolation Boundaries

1. **Zero Browser-to-Judge0 Direct Access:** The browser never receives Judge0 API URLs or administrative tokens. All traffic routes through the MUJCODE backend.
2. **Submission Ownership Persistence:** Every background job (`job:job_xxx`) is tagged with the authenticated user's `userId`. Cross-user inspection is rejected with HTTP 403.
3. **Dual Execution Engine:**
   - Multi-language algorithmic problems run on isolated Judge0 CE workers.
   - Database/SQL curriculum problems run on the ephemeral in-memory SQLite sandbox (`DatabaseSync(':memory:')`) with zero network overhead.
