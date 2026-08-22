import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pgPool } from '../config/postgres.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applySchema() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('[Schema] Applying schema.sql to PostgreSQL...');
  try {
    await pgPool.query(sql);
    console.log('[Schema] Migration successful.');
  } catch (err) {
    console.error('[Schema] Migration failed:', err);
  } finally {
    await pgPool.end();
  }
}

applySchema();
