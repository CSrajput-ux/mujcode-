import { getPostgresPool, closePostgres, initPostgres } from '../lib/postgres.js';

async function migrate() {
  console.log('[Migration] Initializing relational tables in PostgreSQL...');
  await initPostgres();
  const p = getPostgresPool();

  const res = await p.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('applications', 'test_submissions');"
  );
  console.log('[Migration] Confirmed relational tables:', res.rows.map(r => r.table_name));

  // Check unique constraints
  const constrRes = await p.query(
    "SELECT conname FROM pg_constraint WHERE conname IN ('uq_student_job', 'uq_test_student');"
  );
  console.log('[Migration] Confirmed unique constraints:', constrRes.rows.map(r => r.conname));

  await closePostgres();
  console.log('[Migration] Done.');
  process.exit(0);
}

migrate().catch(err => {
  console.error('[Migration] Failed:', err);
  process.exit(1);
});
