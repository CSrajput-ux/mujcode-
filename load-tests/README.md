# MujCode — Production-Grade 500 Concurrent Users Testing Framework

This directory contains the production-grade performance, stress, concurrency, soak, and data-integrity testing framework for the MujCode platform.

## Directory Structure

```
load-tests/
├── config/
│   └── config.js                # Target host, thresholds, SLAs, concurrency levels
├── data/
│   ├── generate_data.js         # Synthetic persona and user generation utility
│   └── synthetic_users.json     # 550 realistic student/admin identities with HMAC-SHA256 JWTs
├── lib/
│   ├── client.js                # Keep-alive HTTP client connection pool with high socket capacity
│   ├── engine.js                # Async concurrency execution engine with jitter and think time
│   ├── generator.js             # Cryptographic JWT generator and realistic profile generator
│   ├── metrics.js               # High-precision Rule 2 metrics collector (p50, p90, p95, p99, exact RPS)
│   └── workflows.js             # Realistic multi-step action loops across 5 user personas
├── personas/
│   └── personas.js              # Distribution specs (60% normal, 10% search, 15% read, 10% write, 5% admin)
├── scenarios/
│   ├── api_benchmark.js         # Core endpoint latency & throughput benchmarking
│   ├── auth_stress.js           # 50, 100, 500 simultaneous logins & token verification
│   ├── concurrency_deep.js      # 10, 50, 100, 500 identical application race tests & lost-update tests
│   ├── data_reconciliation.js   # Direct PostgreSQL ACID integrity & uniqueness constraint auditor
│   ├── failure_injection.js     # Redis fallback, database resilience, and cluster recovery tests
│   ├── file_download_stress.js  # Concurrent streaming file download memory test
│   ├── graduated_load.js        # 1, 5, 10, 25, 50, 100, 250, 350, 400, 500 users
│   ├── ramp_spike.js            # Progressive ramp-up & sudden spike / auto-recovery test
│   ├── ratelimit_test.js        # 429 burst rate limiting & isolation test
│   ├── reproducibility.js       # Three-run 500-user reproducibility test with variance calculation
│   ├── search_pagination.js     # Search query filters & deep pagination stress test
│   ├── security_load_test.js    # IDOR, auth bypass, token tampering, and data isolation
│   ├── soak_test_runner.js      # 500-user sustained soak test with 5-second time-series sampling
│   └── user_journeys.js         # Dedicated multi-step journeys for Student, Job, Test, Admin, File
├── scripts/
│   ├── generate_reports.js      # Generates JSON, CSV, HTML, and Markdown reports
│   ├── run_master_suite.js      # Orchestrates all validation test suites end-to-end
│   └── run_soak_only.js         # Standalone runner for the 500-user soak test
├── results/                     # Raw JSON and CSV metrics output
└── reports/                     # HTML dashboards and Markdown reports
```

## How to Reproduce All Tests

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Backend Cluster (2 Workers)
```bash
node backend/src/server.js
```

### 3. Run the Complete Master 500-User Certification Suite
```bash
node load-tests/scripts/run_master_suite.js
```

### 4. Run the 500-User Sustained Soak Test
```bash
node load-tests/scripts/run_soak_only.js
```
*Optional environment variables:*
- `SOAK_SECONDS=1800` (e.g. 1800 for 30 minutes, 300 for 5 minutes)
- `SOAK_USERS=500`
- `SAMPLE_INTERVAL=5`

### 5. Check Test Reports & Artifacts
- **HTML Dashboard:** `load-tests/reports/500-users-report.html`
- **Markdown Report:** `load-tests/reports/500-users-report.md`
- **CSV Metrics:** `load-tests/results/500-users-summary.csv`
- **JSON Raw Data:** `load-tests/results/master_test_results.json`
- **Comprehensive Audit:** `system_test_report_500_users.md`
