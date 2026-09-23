import pg from 'pg';
import fs from 'node:fs';
import { config } from '../config.js';
import { logger } from './logger.js';

const { Pool } = pg;

let pool = null;
let isConnected = false;

/**
 * Obtain or initialize PostgreSQL Connection Pool
 */
export function getPostgresPool() {
  if (!pool && config.postgresUri) {
    pool = new Pool({
      connectionString: config.postgresUri,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      logger.error('[PostgreSQL] Unexpected pool error on idle client:', err);
    });
  }
  return pool;
}

export function isPostgresConnected() {
  return isConnected;
}

/**
 * Initialize PostgreSQL tables and auto-migrate from db.json if database is fresh
 */
export async function initPostgres() {
  const p = getPostgresPool();
  if (!p) {
    logger.info('[PostgreSQL] POSTGRES_URI not set. Running with local JSON storage engine.');
    return false;
  }

  let client;
  try {
    client = await p.connect();
    isConnected = true;
    logger.info('[PostgreSQL] Successfully connected to database pool.');

    // 1. Create collection table with JSONB support and indexing
    await client.query(`
      CREATE TABLE IF NOT EXISTS mujcode_collections (
        collection_name VARCHAR(100) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_mujcode_collections_name ON mujcode_collections (collection_name);
    `);

    // 2. Check if collections table is empty
    const countRes = await client.query('SELECT COUNT(*) FROM mujcode_collections');
    const existingCount = parseInt(countRes.rows[0].count, 10);

    if (existingCount === 0) {
      logger.info('[PostgreSQL] Fresh database detected. Auto-migrating initial data from JSON storage...');
      await autoMigrateFromJson(client);
    } else {
      logger.info(`[PostgreSQL] Database ready with ${existingCount} active collections.`);
    }

    return true;
  } catch (err) {
    isConnected = false;
    logger.error(`[PostgreSQL] Failed to connect/initialize PostgreSQL: ${err.message}. Falling back to local storage snapshot.`);
    return false;
  } finally {
    if (client) client.release();
  }
}

/**
 * Automatically migrate all keys from db.json into PostgreSQL
 */
async function autoMigrateFromJson(client) {
  try {
    if (!fs.existsSync(config.dbFile)) {
      logger.warn(`[PostgreSQL] DB seed file ${config.dbFile} does not exist. Skipping initial migration.`);
      return;
    }

    const raw = fs.readFileSync(config.dbFile, 'utf8');
    const seed = JSON.parse(raw);
    const keys = Object.keys(seed);

    logger.info(`[PostgreSQL] Migrating ${keys.length} collections into PostgreSQL...`);

    await client.query('BEGIN');
    for (const key of keys) {
      const data = seed[key];
      await client.query(`
        INSERT INTO mujcode_collections (collection_name, data, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (collection_name)
        DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
      `, [key, JSON.stringify(data)]);
    }
    await client.query('COMMIT');

    logger.info(`[PostgreSQL] Successfully migrated ${keys.length} collections to PostgreSQL!`);
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    logger.error('[PostgreSQL] Auto-migration error:', err.message);
  }
}

/**
 * Load all collections from PostgreSQL into memory
 */
export async function loadAllFromPostgres() {
  const p = getPostgresPool();
  if (!p || !isConnected) return null;

  try {
    const res = await p.query('SELECT collection_name, data FROM mujcode_collections');
    if (!res.rows || res.rows.length === 0) return null;

    const db = {};
    for (const row of res.rows) {
      db[row.collection_name] = row.data;
    }
    return db;
  } catch (err) {
    logger.error('[PostgreSQL] Error loading collections from database:', err.message);
    return null;
  }
}

/**
 * Persist an entire database cache into PostgreSQL using a single transaction
 */
export async function saveAllToPostgres(dbCache) {
  const p = getPostgresPool();
  if (!p || !isConnected || !dbCache) return false;

  let client;
  try {
    client = await p.connect();
    await client.query('BEGIN');

    for (const [key, val] of Object.entries(dbCache)) {
      await client.query(`
        INSERT INTO mujcode_collections (collection_name, data, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (collection_name)
        DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
      `, [key, JSON.stringify(val)]);
    }

    await client.query('COMMIT');
    return true;
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    logger.error('[PostgreSQL] Failed to persist collections to PostgreSQL:', err.message);
    return false;
  } finally {
    if (client) client.release();
  }
}

/**
 * Persist a single collection to PostgreSQL
 */
export async function saveCollectionToPostgres(collectionName, data) {
  const p = getPostgresPool();
  if (!p || !isConnected) return false;

  try {
    await p.query(`
      INSERT INTO mujcode_collections (collection_name, data, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (collection_name)
      DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
    `, [collectionName, JSON.stringify(data)]);
    return true;
  } catch (err) {
    logger.error(`[PostgreSQL] Failed to persist collection "${collectionName}":`, err.message);
    return false;
  }
}

/**
 * Gracefully close PostgreSQL connection pool
 */
export async function closePostgres() {
  if (pool) {
    try {
      await pool.end();
      isConnected = false;
      logger.info('[PostgreSQL] Connection pool gracefully closed.');
    } catch (err) {
      logger.error('[PostgreSQL] Error closing pool:', err.message);
    }
  }
}
