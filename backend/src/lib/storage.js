import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

export function loadDb() {
  ensureFile();
  const raw = fs.readFileSync(config.dbFile, 'utf8');
  return JSON.parse(raw);
}

export function saveDb(db) {
  fs.mkdirSync(path.dirname(config.dbFile), { recursive: true });
  fs.writeFileSync(config.dbFile, `${JSON.stringify(db, null, 2)}\n`);
  return db;
}

export function updateDb(updater) {
  const db = loadDb();
  const result = updater(db);
  saveDb(db);
  return result;
}

function ensureFile() {
  fs.mkdirSync(path.dirname(config.dbFile), { recursive: true });
  fs.mkdirSync(config.uploadDir, { recursive: true });

  if (!fs.existsSync(config.dbFile)) {
    fs.writeFileSync(config.dbFile, '{}\n');
  }
}
