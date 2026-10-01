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
    const isSsl = config.postgresUri.includes('sslmode=require') || 
                  config.postgresUri.includes('neon.tech') || 
                  config.postgresUri.includes('supabase') || 
                  config.postgresUri.includes('aws');

    let cleanUri = config.postgresUri;
    if (cleanUri.includes('sslmode=require') && !cleanUri.includes('uselibpqcompat=')) {
      cleanUri += cleanUri.includes('?') ? '&uselibpqcompat=true' : '?uselibpqcompat=true';
    }

    pool = new Pool({
      connectionString: cleanUri,
      ssl: isSsl ? { rejectUnauthorized: false } : undefined,
      max: 30,                          // Increased from 20 for higher concurrency
      min: 2,                           // Keep 2 warm connections ready
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,   // 15s to accommodate Neon serverless wake/pooler
      statement_timeout: 10000,         // Kill queries that run > 10 seconds
      allowExitOnIdle: true,
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

export function getPostgresPoolStats() {
  if (!pool) return { isConnected: false, totalCount: 0, idleCount: 0, waitingCount: 0 };
  return {
    isConnected,
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  };
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

      CREATE TABLE IF NOT EXISTS faculty (
        id VARCHAR(100) PRIMARY KEY,
        faculty_id VARCHAR(100),
        name VARCHAR(255),
        email VARCHAR(255),
        department VARCHAR(255),
        designation VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        raw_data JSONB,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS problems (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        difficulty VARCHAR(50),
        topic VARCHAR(255),
        category VARCHAR(100),
        points INT DEFAULT 10,
        number INT,
        description TEXT,
        constraints TEXT,
        input_format TEXT,
        output_format TEXT,
        sample_input TEXT,
        sample_output TEXT,
        explanation TEXT,
        test_cases JSONB,
        raw_data JSONB,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE OR REPLACE VIEW coding_questions AS SELECT * FROM problems;

      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255),
        role VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        raw_data JSONB,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS students (
        id VARCHAR(100) PRIMARY KEY,
        full_name VARCHAR(255),
        email VARCHAR(255),
        roll_number VARCHAR(100),
        college_id VARCHAR(100),
        branch VARCHAR(100),
        section VARCHAR(50),
        semester INT,
        year VARCHAR(50),
        raw_data JSONB,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        job_id INT NOT NULL,
        student_id VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'Applied',
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT uq_student_job UNIQUE (student_id, job_id)
      );
      CREATE INDEX IF NOT EXISTS idx_applications_student_id ON applications (student_id);
      CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications (job_id);

      CREATE TABLE IF NOT EXISTS test_submissions (
        id VARCHAR(100) PRIMARY KEY,
        test_id VARCHAR(100) NOT NULL,
        student_id VARCHAR(100) NOT NULL,
        student_name VARCHAR(255),
        roll_number VARCHAR(100),
        branch VARCHAR(100),
        section VARCHAR(50),
        score INT DEFAULT 0,
        max_score INT DEFAULT 0,
        status VARCHAR(50),
        answers JSONB,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT uq_test_student UNIQUE (test_id, student_id)
      );
      CREATE INDEX IF NOT EXISTS idx_test_submissions_test_id ON test_submissions (test_id);
      CREATE INDEX IF NOT EXISTS idx_test_submissions_student_id ON test_submissions (student_id);
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

  // Exclude transactional relational collections from monolithic overwrite to prevent multi-worker data loss
  const EXCLUDED_COLLECTIONS = new Set(['applications', 'testSubmissions']);
  const entries = Object.entries(dbCache).filter(([k]) => !EXCLUDED_COLLECTIONS.has(k));
  if (entries.length === 0) return true;

  // Build arrays for a single bulk UPSERT using UNNEST — N collections in 1 query
  const names = entries.map(([k]) => k);
  const datas = entries.map(([, v]) => JSON.stringify(v));

  let client;
  try {
    client = await p.connect();
    await client.query(
      `INSERT INTO mujcode_collections (collection_name, data, updated_at)
       SELECT unnest($1::text[]), unnest($2::jsonb[]), NOW()
       ON CONFLICT (collection_name)
       DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [names, datas]
    );
    return true;
  } catch (err) {
    logger.error('[PostgreSQL] Failed to batch persist collections:', err.message);
    return false;
  } finally {
    if (client) client.release();
  }
}

/**
 * Atomic Application Creation with Unique Constraint Handling
 */
export async function createApplicationPg(jobId, studentId) {
  const p = getPostgresPool();
  if (!p || !isConnected) return null;

  try {
    const res = await p.query(
      `INSERT INTO applications (job_id, student_id, status, applied_at)
       VALUES ($1, $2, 'Applied', NOW())
       ON CONFLICT (student_id, job_id) DO NOTHING
       RETURNING id, job_id as "jobId", student_id as "studentId", status, applied_at as "appliedAt"`,
      [jobId, studentId]
    );
    if (res.rows.length === 0) {
      const existRes = await p.query(
        `SELECT id, job_id as "jobId", student_id as "studentId", status, applied_at as "appliedAt"
         FROM applications WHERE student_id = $1 AND job_id = $2`,
        [studentId, jobId]
      );
      return { conflict: true, application: existRes.rows[0] };
    }
    return { conflict: false, application: res.rows[0] };
  } catch (err) {
    if (err.code === '23505') {
      return { conflict: true };
    }
    throw err;
  }
}

/**
 * Retrieve Applications for a student from authoritative PostgreSQL table
 */
export async function getStudentApplicationsPg(studentId) {
  const p = getPostgresPool();
  if (!p || !isConnected) return null;
  try {
    const res = await p.query(
      `SELECT id, job_id as "jobId", student_id as "studentId", status, applied_at as "appliedAt"
       FROM applications WHERE student_id = $1 ORDER BY applied_at DESC`,
      [studentId]
    );
    return res.rows;
  } catch (err) {
    logger.error('[PostgreSQL] Error fetching student applications:', err.message);
    return null;
  }
}

/**
 * Atomic Test Submission Upsert with Unique Constraint Handling
 */
export async function saveTestSubmissionPg(sub) {
  const p = getPostgresPool();
  if (!p || !isConnected) return null;
  try {
    const res = await p.query(
      `INSERT INTO test_submissions (id, test_id, student_id, student_name, roll_number, branch, section, score, max_score, status, answers, submitted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
       ON CONFLICT (test_id, student_id)
       DO UPDATE SET score = EXCLUDED.score, max_score = EXCLUDED.max_score, status = EXCLUDED.status, answers = EXCLUDED.answers, submitted_at = NOW()
       RETURNING id, test_id as "testId", student_id as "studentId", score, max_score as "maxScore", status, submitted_at as "submittedAt"`,
      [sub._id, sub.testId, sub.studentId, sub.studentName, sub.rollNumber, sub.branch, sub.section, sub.score, sub.maxScore, sub.status, JSON.stringify(sub.answers)]
    );
    return res.rows[0];
  } catch (err) {
    logger.error('[PostgreSQL] Error saving test submission:', err.message);
    return null;
  }
}

/**
 * Retrieve test submissions from authoritative PostgreSQL table
 */
export async function getTestSubmissionsPg(testId) {
  const p = getPostgresPool();
  if (!p || !isConnected) return null;
  try {
    const res = await p.query(
      `SELECT id, test_id as "testId", student_id as "studentId", student_name as "studentName", roll_number as "rollNumber", branch, section, score, max_score as "maxScore", status, answers, submitted_at as "submittedAt"
       FROM test_submissions WHERE test_id = $1 ORDER BY submitted_at DESC`,
      [testId]
    );
    return res.rows;
  } catch (err) {
    logger.error('[PostgreSQL] Error fetching test submissions:', err.message);
    return null;
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

/**
 * Execute direct database integrity audit queries
 */
export async function auditDatabaseIntegrity() {
  const p = getPostgresPool();
  if (!p || !isConnected) {
    return {
      status: 'DISCONNECTED',
      overallDataIntegrityVerdict: 'DATABASE NOT CONNECTED'
    };
  }

  let client;
  try {
    client = await p.connect();
    const appCountRes = await client.query('SELECT count(*) as total FROM applications;');
    const totalApplications = parseInt(appCountRes.rows[0].total, 10);

    const appDupRes = await client.query(`
      SELECT student_id, job_id, count(*) as count
      FROM applications
      GROUP BY student_id, job_id
      HAVING count(*) > 1;
    `);
    const duplicateApplicationsCount = appDupRes.rows.length;

    const appNullRes = await client.query(`
      SELECT count(*) as invalid_count
      FROM applications
      WHERE student_id IS NULL OR job_id IS NULL OR status IS NULL;
    `);
    const invalidApplicationsCount = parseInt(appNullRes.rows[0].invalid_count, 10);

    const subCountRes = await client.query('SELECT count(*) as total FROM test_submissions;');
    const totalSubmissions = parseInt(subCountRes.rows[0].total, 10);

    const subDupRes = await client.query(`
      SELECT test_id, student_id, count(*) as count
      FROM test_submissions
      GROUP BY test_id, student_id
      HAVING count(*) > 1;
    `);
    const duplicateSubmissionsCount = subDupRes.rows.length;

    const collCountRes = await client.query('SELECT count(*) as total FROM mujcode_collections;');
    const totalCollections = parseInt(collCountRes.rows[0].total, 10);

    return {
      status: 'SUCCESS',
      reconciliationTimestamp: new Date().toISOString(),
      tablesAudited: ['applications', 'test_submissions', 'mujcode_collections'],
      applications: {
        totalRows: totalApplications,
        duplicatePairs: duplicateApplicationsCount,
        invalidOrNullRows: invalidApplicationsCount,
        hasDuplicates: duplicateApplicationsCount > 0,
        integrityStatus: (duplicateApplicationsCount === 0 && invalidApplicationsCount === 0) ? 'PASSED' : 'CORRUPTED'
      },
      testSubmissions: {
        totalRows: totalSubmissions,
        duplicatePairs: duplicateSubmissionsCount,
        hasDuplicates: duplicateSubmissionsCount > 0,
        integrityStatus: duplicateSubmissionsCount === 0 ? 'PASSED' : 'CORRUPTED'
      },
      collections: {
        totalActiveCollections: totalCollections,
        integrityStatus: totalCollections > 0 ? 'PASSED' : 'EMPTY'
      },
      overallDataIntegrityVerdict: (duplicateApplicationsCount === 0 && duplicateSubmissionsCount === 0) ? '100% CLEAN / ZERO CORRUPTION' : 'INTEGRITY VIOLATION DETECTED'
    };
  } catch (err) {
    logger.error('[PostgreSQL] Audit error:', err.message);
    return {
      status: 'ERROR',
      error: err.message,
      overallDataIntegrityVerdict: 'AUDIT QUERY ERROR'
    };
  } finally {
    if (client) client.release();
  }
}

