import pg from 'pg';
import { config } from '../config.js';

const { Pool } = pg;

// Define default credentials mirroring docker-compose.yml
const connectionString = process.env.POSTGRES_URI || 'postgres://root:changeme@localhost:5432/mujcode_db';

export const pgPool = new Pool({
  connectionString,
  max: 20, // Max 20 connections in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

import { logger } from '../lib/logger.js';

pgPool.on('error', (err, client) => {
  logger.error('[PostgreSQL] Unexpected error on idle client', err);
});

// Helper for single queries
export const query = (text, params) => pgPool.query(text, params);
