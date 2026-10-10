/**
 * UserRepository
 *
 * Uses the same JSON-file backed in-memory DB as the rest of the app.
 * PostgreSQL / Redis are not available in the local dev setup, so this
 * implementation reads/writes directly from ctx.getDb() / saveDb().
 */
import { loadDb, saveDb } from '../lib/storage.js';

export class UserRepository {
  constructor(ctx) {
    this.ctx = ctx;
  }

  _db() {
    let db = this.ctx?.getDb ? this.ctx.getDb() : loadDb();
    if (!db || !Array.isArray(db.users) || db.users.length === 0) {
      db = loadDb(true);
    }
    if (!db) db = {};
    if (!Array.isArray(db.users)) db.users = [];
    return db;
  }

  _save(db) {
    if (this.ctx?.saveDb) {
      this.ctx.saveDb(db);
    } else {
      saveDb(db);
    }
  }

  async findAll() {
    const db = this._db();
    return Array.isArray(db.users) ? db.users : [];
  }

  // Finds a user by email/college_id and optionally role
  async findByEmailAndRole(identifier, role) {
    const db = this._db();
    const clean = String(identifier || '').trim().toLowerCase();
    const users = Array.isArray(db.users) ? db.users : [];
    return users.find(u => {
      const matchEmail = u.email?.toLowerCase() === clean;
      const matchCollegeId = String(u.college_id || u.collegeId || '').trim().toLowerCase() === clean;
      const matchRole = !role || u.role?.toLowerCase() === String(role).toLowerCase();
      return (matchEmail || matchCollegeId) && matchRole;
    }) || null;
  }

  // Finds all users matching an email or college_id (any role)
  async findAllByEmail(identifier) {
    const db = this._db();
    const clean = String(identifier || '').trim().toLowerCase();
    const users = Array.isArray(db.users) ? db.users : [];
    return users.filter(u => {
      const matchEmail = u.email?.toLowerCase() === clean;
      const matchCollegeId = String(u.college_id || u.collegeId || '').trim().toLowerCase() === clean;
      return matchEmail || matchCollegeId;
    });
  }

  // Updates a single user and persists to disk
  async save(user) {
    const db = this._db();
    if (!Array.isArray(db.users)) db.users = [];
    const idx = db.users.findIndex(u => u.id === user.id || u.id === user._id);
    if (idx !== -1) {
      db.users[idx] = { ...db.users[idx], ...user };
    } else {
      db.users.push(user);
    }
    this._save(db);
    return user;
  }

  // Updates multiple users in one go
  async saveMany(users) {
    const db = this._db();
    if (!Array.isArray(db.users)) db.users = [];
    for (const user of users) {
      const idx = db.users.findIndex(u => u.id === user.id || u.id === user._id);
      if (idx !== -1) {
        db.users[idx] = { ...db.users[idx], ...user };
      } else {
        db.users.push(user);
      }
    }
    this._save(db);
  }
}
