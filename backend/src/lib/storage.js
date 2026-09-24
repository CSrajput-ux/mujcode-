import fs from 'node:fs';
import path from 'node:path';
import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';
import {
  rebuildFastIndices,
  writeFacultyFileSync,
  writeStudentsFileSync,
} from './fastStore.js';
import {
  isPostgresConnected,
  saveAllToPostgres,
  loadAllFromPostgres
} from './postgres.js';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── High-Performance PostgreSQL + In-Memory Hybrid DB Engine ─────────────
// Keeps the database in memory for 0ms reads and debounces writes
// to PostgreSQL (ACID persistence) and disk snapshot worker threads.

let dbCache = null;
let saveTimeout = null;
let isDirty = false;
let isFlushing = false;

// Initialize the storage worker for background file snapshots
const worker = new Worker(path.join(__dirname, 'storageWorker.js'));

worker.on('message', (msg) => {
  if (msg.type === 'SUCCESS') {
    isFlushing = false;
    if (isDirty) scheduleSave();
  } else if (msg.type === 'ERROR') {
    logger.error('[StorageEngine] Worker flush error:', msg.error);
    isFlushing = false;
  }
});

worker.on('error', (err) => {
  logger.error('[StorageEngine] Worker thread crash:', err);
  isFlushing = false;
});

export function setDbCache(cache) {
  dbCache = cache;
  if (!dbCache.faculty) dbCache.faculty = [];
  if (!dbCache.students) dbCache.students = [];
  rebuildFastIndices(dbCache.faculty, dbCache.students);
}

export function loadDb() {
  if (dbCache) {
    return dbCache;
  }

  ensureFile();
  const raw = fs.readFileSync(config.dbFile, 'utf8');
  dbCache = JSON.parse(raw);

  if (!dbCache.faculty) dbCache.faculty = [];
  if (!dbCache.students) dbCache.students = [];

  // Sync with dedicated JSON files if missing or empty
  if (!fs.existsSync(config.facultyFile) || fs.statSync(config.facultyFile).size <= 5) {
    writeFacultyFileSync(dbCache.faculty);
  }
  if (!fs.existsSync(config.studentsFile) || fs.statSync(config.studentsFile).size <= 5) {
    writeStudentsFileSync(dbCache.students);
  }

  // Populate fast-access O(1) in-memory indices
  rebuildFastIndices(dbCache.faculty, dbCache.students);

  return dbCache;
}

export async function loadDbFromPostgresOrFile() {
  if (isPostgresConnected()) {
    try {
      const pgData = await loadAllFromPostgres();
      if (pgData && Object.keys(pgData).length > 0) {
        setDbCache(pgData);
        logger.info(`[StorageEngine] Successfully hydrated in-memory store from PostgreSQL (${Object.keys(pgData).length} collections).`);
        return dbCache;
      }
    } catch (err) {
      logger.warn(`[StorageEngine] Failed to load from PostgreSQL: ${err.message}. Falling back to disk.`);
    }
  }

  return loadDb();
}

export function loadFaculty() {
  const db = loadDb();
  return db.faculty || [];
}

export function loadStudents() {
  const db = loadDb();
  return db.students || [];
}

export function saveDb(db) {
  dbCache = db;
  isDirty = true;
  // Keep O(1) indices updated immediately
  rebuildFastIndices(db.faculty || [], db.students || []);
  scheduleSave();
  return db;
}

function scheduleSave() {
  if (saveTimeout || isFlushing) return;
  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    flushDbAsync();
  }, 300); // 300ms debounced persistence
}

async function flushDbAsync() {
  if (!isDirty || !dbCache || isFlushing) return;
  
  isFlushing = true;
  isDirty = false;
  
  // 1. Asynchronously persist to PostgreSQL if connected
  if (isPostgresConnected()) {
    saveAllToPostgres(dbCache).catch((err) => {
      logger.error('[StorageEngine] Async PostgreSQL flush error:', err.message);
    });
  }

  // 2. Offload disk snapshot to worker thread
  worker.postMessage({
    type: 'FLUSH',
    payload: {
      dbCache,
      dbFile: config.dbFile,
      facultyFile: config.facultyFile,
      studentsFile: config.studentsFile
    }
  });
}

export function flushDbSync() {
  if (!isDirty || !dbCache) return;
  try {
    ensureFile();
    const dir = path.dirname(config.dbFile);
    const tmpFile = path.join(dir, `db.tmp.${Date.now()}`);
    fs.writeFileSync(tmpFile, `${JSON.stringify(dbCache, null, 2)}\n`, 'utf8');
    fs.renameSync(tmpFile, config.dbFile);

    if (dbCache.faculty && Array.isArray(dbCache.faculty)) {
      writeFacultyFileSync(dbCache.faculty);
    }
    if (dbCache.students && Array.isArray(dbCache.students)) {
      writeStudentsFileSync(dbCache.students);
    }

    // Persist to PostgreSQL if connected
    if (isPostgresConnected()) {
      saveAllToPostgres(dbCache).catch(() => {});
    }

    isDirty = false;
  } catch (err) {
    logger.error('[StorageEngine] Error flushing DB to disk:', err.message);
  } finally {
    saveTimeout = null;
  }
}

function ensureFile() {
  const dir = path.dirname(config.dbFile);
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(config.uploadDir, { recursive: true });

  if (!fs.existsSync(config.dbFile)) {
    fs.writeFileSync(config.dbFile, '{}\n', 'utf8');
  }
  if (!fs.existsSync(config.facultyFile)) {
    fs.writeFileSync(config.facultyFile, '[]\n', 'utf8');
  }
  if (!fs.existsSync(config.studentsFile)) {
    fs.writeFileSync(config.studentsFile, '[]\n', 'utf8');
  }
}

// Flush dirty state on process exit (synchronous — last-resort safety net).
// NOTE: SIGINT and SIGTERM are handled by server.js gracefulShutdown which
// calls flushDbSync() before process.exit(), so we do NOT register them here
// to avoid double exit() calls and conflicting shutdown sequences.
process.on('exit', () => flushDbSync());
