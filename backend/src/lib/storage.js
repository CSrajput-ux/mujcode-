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
  saveCollectionToPostgres,
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
const dirtyCollections = new Set();

// Initialize the storage worker for background file snapshots
const worker = new Worker(path.join(__dirname, 'storageWorker.js'));
worker.unref();

worker.on('message', (msg) => {
  if (msg.type === 'SUCCESS') {
    isFlushing = false;
    if (isDirty || dirtyCollections.size > 0) scheduleSave();
  } else if (msg.type === 'ERROR') {
    logger.error('[StorageEngine] Worker flush error:', msg.error);
    isFlushing = false;
  }
});

worker.on('error', (err) => {
  logger.error('[StorageEngine] Worker thread crash:', err);
  isFlushing = false;
});

export async function terminateStorageWorker() {
  try {
    await worker.terminate();
  } catch {}
}

export function setDbCache(cache) {
  dbCache = cache;
  if (!dbCache.faculty) dbCache.faculty = [];
  if (!dbCache.students) dbCache.students = [];
  if (!dbCache.users) dbCache.users = [];
  rebuildFastIndices(dbCache.faculty, dbCache.students);
}

export function loadDb(forceReload = false) {
  if (dbCache && !forceReload) {
    return dbCache;
  }

  ensureFile();
  const raw = fs.readFileSync(config.dbFile, 'utf8');
  dbCache = JSON.parse(raw);

  if (!dbCache.faculty) dbCache.faculty = [];
  if (!dbCache.students) dbCache.students = [];
  if (!dbCache.users) dbCache.users = [];

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
  const diskDb = loadDb(true);
  if (isPostgresConnected()) {
    try {
      const pgData = await loadAllFromPostgres();
      if (pgData && Object.keys(pgData).length > 0) {
        // Merge disk snapshot collections with pgData so latest writes to placementDrives / activityLogs aren't lost
        for (const [key, val] of Object.entries(diskDb)) {
          if (!pgData[key]) {
            pgData[key] = val;
          } else if (Array.isArray(val) && Array.isArray(pgData[key])) {
            const existingIds = new Set(pgData[key].map(item => String(item._id || item.id || JSON.stringify(item))));
            for (const item of val) {
              const id = String(item._id || item.id || JSON.stringify(item));
              if (!existingIds.has(id)) {
                pgData[key].push(item);
                existingIds.add(id);
              }
            }
          }
        }
        setDbCache(pgData);
        logger.info(`[StorageEngine] Successfully hydrated in-memory store from PostgreSQL (${Object.keys(pgData).length} collections).`);
        return dbCache;
      }
    } catch (err) {
      logger.warn(`[StorageEngine] Failed to load from PostgreSQL: ${err.message}. Falling back to disk.`);
    }
  }

  return diskDb;
}

export function loadFaculty() {
  const db = loadDb();
  return db.faculty || [];
}

export function loadStudents() {
  const db = loadDb();
  return db.students || [];
}

export function broadcastCacheSync(collection, data) {
  if (process.send) {
    try {
      process.send({ type: 'CACHE_SYNC', collection, data });
    } catch {
      // IPC channel closed
    }
  }
}

const FORBIDDEN_STORAGE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function onWorkerCacheSync(message) {
  if (!dbCache || !message) return;
  if (FORBIDDEN_STORAGE_KEYS.has(message.collection)) return;
  if (message.collection === 'all' && message.data) {
    dbCache = message.data;
    rebuildFastIndices(dbCache.faculty || [], dbCache.students || []);
  } else if (message.collection && message.data) {
    dbCache[message.collection] = message.data;
    if (message.collection === 'faculty' || message.collection === 'students') {
      rebuildFastIndices(dbCache.faculty || [], dbCache.students || []);
    }
  }
  logger.info(`[ClusterSync] Worker ${process.pid} synchronized collection "${message.collection || 'all'}".`);
}

export function saveDb(db, collection = null) {
  dbCache = db;
  isDirty = true;
  if (collection) {
    dirtyCollections.add(collection);
  } else {
    dirtyCollections.add('all');
  }

  // Keep O(1) indices updated immediately
  if (!collection || collection === 'faculty' || collection === 'students' || collection === 'all') {
    rebuildFastIndices(db.faculty || [], db.students || []);
  }

  broadcastCacheSync(collection || 'all', collection ? db[collection] : db);
  scheduleSave();
  return db;
}

function scheduleSave() {
  if (saveTimeout || isFlushing) return;
  const debounceMs = config.saveDebounceMs !== undefined ? config.saveDebounceMs : 100;
  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    flushDbAsync();
  }, debounceMs); // Responsive debounce (100ms default) — prevents multi-worker data loss
}

async function flushDbAsync() {
  if ((dirtyCollections.size === 0 && !isDirty) || !dbCache || isFlushing) return;

  isFlushing = true;
  const toFlush = new Set(dirtyCollections);
  dirtyCollections.clear();
  isDirty = false;

  // 1. PostgreSQL save — granular collection persistence or full-state fallback
  if (isPostgresConnected()) {
    try {
      if (toFlush.has('all')) {
        await saveAllToPostgres(dbCache);
      } else {
        for (const col of toFlush) {
          if (dbCache[col] !== undefined) {
            await saveCollectionToPostgres(col, dbCache[col]);
          }
        }
      }
    } catch (err) {
      logger.error('[StorageEngine] Async PostgreSQL flush error:', err.message);
      // Re-queue failed collections so they retry on next cycle rather than silently dropping
      for (const col of toFlush) {
        dirtyCollections.add(col);
      }
    }
  }

  // 2. Disk snapshot via worker thread
  worker.postMessage({
    type: 'FLUSH',
    payload: {
      dbCache,
      dbFile: config.dbFile,
      facultyFile: config.facultyFile,
      studentsFile: config.studentsFile
    }
  });
  // isFlushing is reset in worker.on('message') handler above
}

export function flushDbSync() {
  if (!dbCache || (!isDirty && dirtyCollections.size === 0)) return;
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
    dirtyCollections.clear();
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
