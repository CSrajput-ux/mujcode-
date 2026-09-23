#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Load environment variables
try {
  process.loadEnvFile(path.resolve(rootDir, '.env'));
} catch (e) {
  // Ignore if missing
}

const { Pool } = pg;
const postgresUri = process.env.POSTGRES_URI || 'postgres://postgres:postgres@localhost:5432/mujcode_db';
const dbFile = path.resolve(rootDir, process.env.DB_FILE || 'src/data/db.json');

console.log('=============================================================');
console.log('🐘 MujCode PostgreSQL Migration Tool');
console.log('=============================================================');
console.log(`📡 Connecting to:  ${postgresUri.replace(/:[^:@]+@/, ':****@')}`);
console.log(`📂 Source File:    ${dbFile}`);
console.log('-------------------------------------------------------------');

if (!fs.existsSync(dbFile)) {
  console.error(`❌ Source database file not found at: ${dbFile}`);
  process.exit(1);
}

const raw = fs.readFileSync(dbFile, 'utf8');
let seedData;
try {
  seedData = JSON.parse(raw);
} catch (err) {
  console.error(`❌ Failed to parse JSON from ${dbFile}:`, err.message);
  process.exit(1);
}

const pool = new Pool({
  connectionString: postgresUri,
  connectionTimeoutMillis: 10000,
});

async function runMigration() {
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Connected to PostgreSQL successfully.');

    // 1. Create schema
    console.log('🛠️  Ensuring schema and tables exist...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS mujcode_collections (
        collection_name VARCHAR(100) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_mujcode_collections_name ON mujcode_collections (collection_name);
    `);
    console.log('✅ Schema verified.');

    // 2. Begin transaction
    console.log('🚀 Migrating collections to PostgreSQL...');
    await client.query('BEGIN');

    const collections = Object.keys(seedData);
    let totalItems = 0;

    for (const name of collections) {
      const data = seedData[name];
      const count = Array.isArray(data) ? data.length : (typeof data === 'object' && data !== null ? Object.keys(data).length : 1);
      totalItems += Array.isArray(data) ? data.length : 1;

      await client.query(`
        INSERT INTO mujcode_collections (collection_name, data, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (collection_name)
        DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
      `, [name, JSON.stringify(data)]);

      console.log(`   📦 Migrated [${name}]: ${count} records`);
    }

    await client.query('COMMIT');
    console.log('-------------------------------------------------------------');
    console.log(`🎉 Migration Completed Successfully!`);
    console.log(`📊 Total Collections: ${collections.length}`);
    console.log(`📄 Total Records:     ${totalItems}`);
    console.log('=============================================================');
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

runMigration();
