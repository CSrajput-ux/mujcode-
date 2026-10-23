# MUJCODE — Comprehensive Testing Plan

This document defines an evidence-based testing sequence for the frontend, backend API, compiler engine, local compiler agent, and deployment pipeline.

## Test levels

1. **Unit tests** — pure functions, validators, authorization helpers, language mapping, SQL isolation, data transforms.
2. **Component tests** — frontend components, form states, rendering, validation, loading/error states.
3. **Integration tests** — route + auth + storage, API + database/cache, agent pairing + Socket.IO, frontend API client contract.
4. **System tests** — built frontend + running backend, critical user journeys, auth/session lifecycle, compilation submission, uploads/downloads.
5. **End-to-end (E2E)** — browser workflows against a running app with deterministic seeded test data; tests must assert user-visible outcomes rather than merely that navigation completed.
6. **Security tests** — authentication, role boundaries, IDOR, CORS, input validation, upload traversal, SSRF, compiler sandbox, secrets/dependency scan.
7. **Performance and reliability** — smoke/load tests, latency/error-rate baselines, concurrency, timeout behavior, Redis/Postgres disconnects and recovery.
8. **Compatibility / accessibility** — supported browsers, keyboard navigation, accessible labels, responsive viewports.
9. **Migration / recovery** — schema upgrade/downgrade where supported, backup restore drill, consistency/integrity validation.

## Existing test commands

Run from repository root after installing dependencies:

```bash
npm run install:all
npm test
npm run test:compiler
npm run build
npm test --prefix frontend
npm run test:e2e --prefix frontend
npm test --prefix compiler-engine
npm run test:security --prefix compiler-engine
npm run test:matrix --prefix compiler-engine
```

Backend live integration tests can depend on a running Judge0 or compiler engine. Those tests must be reported as **SKIPPED / BLOCKED**, not passed, when dependencies are unavailable.

## Test data and environment rules

- Use a dedicated ephemeral test database / test namespace; never point tests at production.
- Do not store production credentials or user data in fixtures.
- Tests should clean up users, pairing codes, devices, uploaded files, sockets, and temporary records.
- Prefer deterministic fixtures and explicit timeouts.
- Avoid `process.exit()` in tests; it can hide leaked handles and truncate test reports.
- CI should fail on test failures, type errors, build errors, security scanner errors above the chosen threshold, and E2E assertion failures.
- Do not treat mocked tests as proof that the live backend, database, external compiler, or deployment is healthy.

## Current verified observations from repository review

- Backend Node test runner suites exist for compiler behavior, Judge0, security, storage, MFA, agent gateway, and production-hardening gates.
- Frontend Vitest suites and a Playwright E2E file exist.
- Compiler-engine has language-matrix and security tests.
- The current Playwright file contains several assertions that only check URL definedness or test local placeholder logic. These do not verify the actual login/dashboard/submit behavior and should be rewritten to assert observable UI state and network effects.
- Existing audit evidence calls out incomplete end-to-end auth, authenticated API/database integration, database migrations, upload/download, exam-proctoring and environment-dependent language execution checks.
- This branch adds a small live HTTP contract smoke suite. It is an initial system-test layer, not a substitute for isolated database integration tests or real browser journeys.

## Release gate checklist

- [ ] Unit and component tests pass.
- [ ] Authenticated API integration tests pass against isolated test state.
- [ ] Compiler tests pass; environment-specific skips have a linked reason and separate Linux runner where needed.
- [ ] Browser E2E tests assert real UI outcomes and role restrictions.
- [ ] Security tests pass; known advisories are triaged.
- [ ] Migrations and restore procedures verified in disposable environments.
- [ ] Load test results include concurrency, p50/p95/p99 latency, throughput and error rate.
- [ ] Staging smoke test passes before production deployment.
