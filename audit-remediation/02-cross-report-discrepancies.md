# 02 — Cross-Report Discrepancies & Resolutions
**MujCode Platform — Reconciliation of Audit Observations vs Actual Source Code**

---

## 1. Discrepancy Reconciliation Ledger

### Discrepancy 1: Framework Architecture (Express vs Zero-Dependency Native Server)
- **Earlier Mention:** Some early audit sections referenced Express middleware patterns (`app.use(express.json())`).
- **Actual Codebase:** The backend is a **Zero-Dependency Native HTTP Server** (`node:http`, `Router` class, `sendJson()`, `parseBody()`, `fastParseUrl()`).
- **Resolution:** All subsequent reports, remediation steps, and tests are strictly aligned with the native router architecture without adding Express overhead.

### Discrepancy 2: Compiler Engine Scope (Judge0 vs SqlExecutionProvider)
- **Initial Question:** Whether `SqlExecutionProvider` was a legacy conflicting runner.
- **Source Inspection Evidence:** `SqlExecutionProvider` is an **intentional, dedicated in-memory SQLite sandbox** (`DatabaseSync(':memory:')`) designed specifically for SQL curriculum problems with custom schemas and seed data.
- **Resolution:** Retained and hardened `SqlExecutionProvider` for SQL queries while routing all 14 general programming languages exclusively through `Judge0ExecutionProvider`.

### Discrepancy 3: Judge0 Multi-Language Testing Environment
- **Observation:** `npm run test` executes 30 passes and 3 skips (JavaScript, Java, Go) when running on Windows 11 WSL2.
- **Root Cause:** Node.js V8, Java OpenJDK JVM, and Go runtime require Linux cgroups v1 memory controllers for address-space virtualization in isolate sandboxes. Windows WSL2 defaults to cgroups v2 unified hierarchy without memory swap controllers.
- **Resolution:** Documented exact environment prerequisites for Ubuntu 22.04/24.04 LTS deployment targets while keeping Python, C, C++, and SQL 100% operational in local development.

### Discrepancy 4: E2E Automation Status
- **Observation:** QA reports noted user journeys validated, while Playwright automation was described as planned.
- **Resolution:** Documented the distinction: unit, compiler, security, and storage suites (33 tests) are automated via `node --test`, while browser E2E flows are staged for Playwright integration.
