import fs from 'node:fs';
import path from 'node:path';
import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── High-Performance In-Memory DB Engine ──────────────────────────────────
// Keeps the database in memory for 0ms reads and debounces disk writes
// using a Worker Thread to prevent event loop blocking under load.

let dbCache = null;
let saveTimeout = null;
let isDirty = false;
let isFlushing = false;

// Initialize the storage worker
const worker = new Worker(path.join(__dirname, 'storageWorker.js'));

worker.on('message', (msg) => {
  if (msg.type === 'SUCCESS') {
    isFlushing = false;
    // If more changes happened while flushing, schedule another save
    if (isDirty) scheduleSave();
  } else if (msg.type === 'ERROR') {
    console.error('[StorageEngine] Worker flush error:', msg.error);
    isFlushing = false;
  }
});

worker.on('error', (err) => {
  console.error('[StorageEngine] Worker thread crash:', err);
  isFlushing = false;
});

export function loadDb() {
  if (dbCache) {
    return dbCache;
  }
  ensureFile();
  const raw = fs.readFileSync(config.dbFile, 'utf8');
  dbCache = JSON.parse(raw);
  return dbCache;
}

export function saveDb(db) {
  dbCache = db;
  isDirty = true;
  scheduleSave();
  return db;
}

export function updateDb(updater) {
  const db = loadDb();
  const result = updater(db);
  saveDb(db);
  return result;
}

function scheduleSave() {
  if (saveTimeout || isFlushing) return;
  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    flushDbAsync();
  }, 300); // 300ms debounced persistence
}

function flushDbAsync() {
  if (!isDirty || !dbCache || isFlushing) return;
  
  isFlushing = true;
  isDirty = false;
  
  // Clone the cache deeply if needed, but for performance, we pass the object.
  // worker_threads uses structured cloning which handles stringification safely.
  worker.postMessage({
    type: 'FLUSH',
    payload: {
      dbCache,
      dbFile: config.dbFile
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
    isDirty = false;
  } catch (err) {
    console.error('[StorageEngine] Error flushing DB to disk:', err.message);
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
}

// Flush dirty state on process shutdown
process.on('exit', () => flushDbSync());
process.on('SIGINT', () => { flushDbSync(); process.exit(0); });
process.on('SIGTERM', () => { flushDbSync(); process.exit(0); });

