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
    // Prefer ctx if available (keeps same in-memory cache), else load fresh
    return this.ctx?.getDb ? this.ctx.getDb() : loadDb();
  }

  _save(db) {
    if (this.ctx?.saveDb) {
      this.ctx.saveDb(db);
    } else {
      saveDb(db);
    }
  }

  async findAll() {
    return this._db().users;
  }

  // Finds a user by email/college_id and optionally role
  async findByEmailAndRole(identifier, role) {
    const db = this._db();
    const clean = String(identifier || '').trim().toLowerCase();
    return db.users.find(u => {
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
    return db.users.filter(u => {
      const matchEmail = u.email?.toLowerCase() === clean;
      const matchCollegeId = String(u.college_id || u.collegeId || '').trim().toLowerCase() === clean;
      return matchEmail || matchCollegeId;
    });
  }

  // Updates a single user and persists to disk
  async save(user) {
    const db = this._db();
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
