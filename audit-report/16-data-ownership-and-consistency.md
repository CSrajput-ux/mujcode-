# 16 — Storage, Data Ownership & Consistency Audit
**MujCode Platform — Data Layer Architecture, Concurrency Guarantees & State Synchronization**

---

## 1. Storage Architecture Overview

The backend uses a **Hybrid Multi-Tier Storage Architecture**:
1. **Tier 1 (In-Memory Cache - `dbCache` & `fastStore.js`):** Sub-millisecond reads for high-frequency entities (faculty, students, questions, permissions).
2. **Tier 2 (PostgreSQL - `src/lib/postgres.js`):** Authoritative ACID store with relational tables for high-concurrency transactional entities (`applications`, `test_submissions`, `users`, `problems`, `students`, `faculty`) and `mujcode_collections` (JSONB bulk store).
3. **Tier 3 (Worker Thread Disk Snapshot - `storageWorker.js`):** Atomic local file snapshots (`db.tmp -> rename to db.json`) run on background worker threads without blocking the event loop.
4. **Tier 4 (MongoDB - `src/models/` & `modules/ats/`):** Optional document store for ATS resumes and detailed historical code execution logs.

---

## 2. Comprehensive Data Ownership Matrix

| Entity | Authoritative Database | Primary Read Path | Primary Write Path | Concurrency Control | Fallback Behavior |
|---|---|---|---|---|---|
| **Users** | PostgreSQL (`users` & `mujcode_collections`) | `UserRepository.findByEmail` / In-Memory `dbCache.users` | `UserRepository.save` -> `saveCollectionToPostgres('users')` | Last-Write-Wins (LWW) with IPC Sync | `db.json` local file snapshot |
| **Students** | PostgreSQL (`students` & `fastStore`) | `fastStore.findStudentById` / `findStudentByRollNumber` | `saveDb(db, 'students')` -> `writeStudentsFileSync` + PG save | O(1) Index Rebuild + IPC Broadcast | `students.json` dedicated file |
| **Faculty** | PostgreSQL (`faculty` & `fastStore`) | `fastStore.findFacultyById` / `findFacultyByEmail` | `saveDb(db, 'faculty')` -> `writeFacultyFileSync` + PG save | O(1) Index Rebuild + IPC Broadcast | `faculty.json` dedicated file |
| **Problems / Questions** | PostgreSQL (`problems` & `mujcode_collections`) | `dbCache.problems` / `dbCache.codingQuestions` | `saveDb(db, 'problems')` -> `saveCollectionToPostgres('problems')` | Atomic collection replacement | `db.json` local file snapshot |
| **Job Applications** | PostgreSQL (`applications` table) | `getStudentApplicationsPg(studentId)` | `createApplicationPg(jobId, studentId)` | **Strict ACID:** `UNIQUE (student_id, job_id)` constraint | In-memory array fallback if PG unavailable |
| **Test Submissions** | PostgreSQL (`test_submissions` table) | `getTestSubmissionsPg(testId)` | `saveTestSubmissionPg(sub)` | **Strict ACID:** `UNIQUE (test_id, student_id)` constraint | In-memory array fallback if PG unavailable |
| **Assignments** | PostgreSQL (`mujcode_collections`) | `dbCache.assignments` | `saveDb(db, 'assignments')` | Debounced collection flush (100ms) | `db.json` local file snapshot |
| **Tests / Exams** | PostgreSQL (`mujcode_collections`) | `dbCache.tests` | `saveDb(db, 'tests')` | Debounced collection flush (100ms) | `db.json` local file snapshot |
| **Code Executions** | MongoDB (`CodeExecution` model) / Redis | `CodeExecution.findById` / `redis.get('job:id')` | `CodeExecution.create` / `CodeExecution.findByIdAndUpdate` | Document ID UUID / Job ID | Redis ephemeral job state (1h TTL) |
| **ATS Records** | MongoDB (`AtsCandidate` model) | Mongoose queries (`/modules/ats`) | Mongoose mutations | MongoDB optimistic concurrency | Memory mock store |

---

## 3. Deep-Dive Concurrency & Consistency Mechanisms

### 3.1 Protection Against Multi-Worker Data Overwrite
- **The Problem:** In a multi-worker cluster, if worker A writes an application and worker B concurrently saves general database state, a monolithic `saveAllToPostgres()` could overwrite worker A's new application.
- **The Code Implementation (`postgres.js:256-258`):**
  ```javascript
  const EXCLUDED_COLLECTIONS = new Set(['applications', 'testSubmissions']);
  const entries = Object.entries(dbCache).filter(([k]) => !EXCLUDED_COLLECTIONS.has(k));
  ```
- **Guarantees:**
  - High-concurrency entities (`applications`, `test_submissions`) bypass monolithic JSON collection overwrites completely.
  - They execute dedicated parameterized `INSERT INTO ... ON CONFLICT ...` queries directly against PostgreSQL tables.
  - Zero risk of dropped applications or overwritten test submissions during concurrent student submissions.

### 3.2 Atomic File Snapshotting (`fastStore.js` & `storageWorker.js`)
- **Mechanism:** When writing to disk, the backend writes to a temporary file (`db.tmp.<timestamp>`) and executes an atomic POSIX `renameSync` to replace `db.json`.
- **Guarantees:**
  - Prevents corrupted, half-written JSON files if a container abruptly terminates mid-write.
  - Background thread execution via `Worker` prevents event-loop blocking during large JSON serializations.

### 3.3 Database Reconciliation & Self-Healing (`postgres.js:434-511`)
- The backend exposes an automated database integrity audit query (`auditDatabaseIntegrity()`):
  - Checks for duplicate `(student_id, job_id)` pairs in `applications`.
  - Checks for duplicate `(test_id, student_id)` pairs in `test_submissions`.
  - Audits NULL or orphaned foreign keys across active tables.
  - Returns `100% CLEAN / ZERO CORRUPTION` status to `/api/system/reconciliation`.

---

## 4. Identified Storage Risks & Remediation

| Finding ID | Severity | Component | Finding Description & Remediation |
|---|---|---|---|
| **DATA-01** | Low / Medium | `storage.js:159` | **Debounce Window Data Loss Window:** In-memory writes are debounced for 100ms before flushing to PostgreSQL. An abrupt OS kill (`kill -9`) within that 100ms window could lose the latest in-memory mutations. **Remediation:** Critical operations (e.g. final exam submission) already use synchronous direct PG writes (`saveTestSubmissionPg`), which is correct. Continue ensuring all grading and submission endpoints use direct PG methods rather than purely relying on debounced `saveDb`. |
| **DATA-02** | Low | `fastStore.js` | **Dual File Sync:** `faculty.json` and `students.json` are maintained in parallel with `db.json`. In production with PostgreSQL connected, PostgreSQL is the single source of truth; JSON files act strictly as cold backup snapshots. |
