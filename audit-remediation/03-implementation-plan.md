# 03 — Implementation & Remediation Plan
**MujCode Platform — Phased Execution Strategy & Verification Gates**

---

## 1. Phased Execution Roadmap

```
Stage A (Baseline & Register) ──► Stage B (Security Hardening) ──► Stage C (DB Durability)
                                                                           │
Stage F (Frontend Quality)    ◄── Stage E (Compiler Security)  ◄── Stage D (Backups & DR)
        │
        ▼
Stage G (Backend Reliability) ──► Stage H (Docker & DevSecOps) ──► Stage I-L (Final QA & Release)
```

---

## 2. Stage Breakdown & Acceptance Gates

### Stage B: Security Hardening
- **Task B1 (CORS & Env Validation):** Verify `envValidator.js` rejects wildcard `CORS_ORIGIN=*` in production and validates required secrets.
- **Task B2 (Frontend Dependencies):** Patch high-severity TipTap and transitive dependencies while preserving rich-text editor features.
- **Task B3 (Judge0 Secrets):** Ensure all secrets in `judge0.conf` and compose files load strictly from environment variables.
- **Task B4 (Auth & Authz Negative Tests):** Execute automated negative authorization tests ensuring cross-user ID tampering is strictly rejected with HTTP 403.
- **Task B5 (Judge Submission Security):** Verify all judge polling endpoints enforce caller ownership or return sanitized public verdicts.

### Stage C: Database Durability & Outage Policies
- **Task C1 (Authoritative Data Routing):** Ensure transactional entities (`applications`, `test_submissions`) write directly to PostgreSQL with unique constraint handling.
- **Task C2 (Outage Behavior):** Provide accurate database health indicators and avoid silent data loss during connection drops.
- **Task C3 (Connection Pool Sizing):** Configure right-sized connection pools (1-5 per worker) to prevent RDS pool saturation.

### Stage D: Backup & Disaster Recovery
- **Task D1 (Automated Backup Script):** Provide an executable, validated `pg_dump` backup script with gzip compression, checksum calculation, and non-zero error exits.
- **Task D2 (Restoration Verification):** Document exact recovery commands and RPO/RTO validation.

### Stage E: Compiler & Code Execution Security
- **Task E1 (Language Routing):** Verify 14 Judge0 languages + dedicated in-memory SQLite sandbox.
- **Task E2 (Sandbox Safety):** Enforce CPU (2.0s), Wall (5.0s), and Memory (128MB) limits with graceful timeout error responses.

### Stage F: Frontend Performance & Quality
- **Task F1 (Monaco Lifecycle):** Verify proper cleanup on unmount to prevent browser memory leaks.
- **Task F2 (Bundle & Typecheck):** Ensure production build (`tsc -b && vite build`) executes cleanly with zero TypeScript errors.

---

## 3. Risk Mitigation & Rollback Strategy

1. **Working Tree Safety:** Every code modification is preceded by git diff verification and executed in isolated units.
2. **Reversibility:** Code changes are designed to be backward-compatible with existing client stores and PostgreSQL schemas.
3. **No Production Overwrite:** Local development testing preserves pre-existing configurations and does not perform destructive operations on live databases.
