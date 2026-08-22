/**
 * UserRepository
 * 
 * Implements the Repository Pattern for User entities.
 * This abstracts away the underlying database technology (JSON db currently)
 * so that when we migrate to PostgreSQL, we ONLY change this file,
 * and zero business logic files need to be touched.
 */
import { pgPool } from '../config/postgres.js';
import { redis } from '../config/redis.js';
import { logger } from '../lib/logger.js';

const CACHE_TTL_SECONDS = 300; // 5 minutes

export class UserRepository {
  constructor(ctx) {
    this.ctx = ctx; // Retained for backwards compatibility if needed
  }

  // Returns all users
  async findAll() {
    const { rows } = await pgPool.query('SELECT * FROM users');
    return rows;
  }

  // Finds a user by email and optionally role (With Redis Caching)
  async findByEmailAndRole(email, role) {
    const cacheKey = `user:email:${email}:role:${role || 'any'}`;
    
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      logger.error('[Redis Cache Error]', err);
    }

    let queryText = 'SELECT * FROM users WHERE email ILIKE $1';
    let params = [email];

    if (role) {
      queryText += ' AND role = $2';
      params.push(role);
    }

    const { rows } = await pgPool.query(queryText, params);
    const user = rows[0];

    if (user) {
      try {
        await redis.set(cacheKey, JSON.stringify(user), 'EX', CACHE_TTL_SECONDS);
      } catch (err) {
        logger.error('[Redis Cache Error]', err);
      }
    }

    return user;
  }

  // Finds all users matching an email
  async findAllByEmail(email) {
    const { rows } = await pgPool.query('SELECT * FROM users WHERE email ILIKE $1', [email]);
    return rows;
  }

  // Updates a single user and flushes to disk
  async save(user) {
    const query = `
      INSERT INTO users (id, name, email, password, role, "isActive", "isPasswordChanged")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        password = EXCLUDED.password,
        role = EXCLUDED.role,
        "isActive" = EXCLUDED."isActive",
        "isPasswordChanged" = EXCLUDED."isPasswordChanged",
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const values = [
      user.id || user._id, 
      user.name || 'Unknown', 
      user.email, 
      user.password, 
      user.role, 
      user.isActive ?? true, 
      user.isPasswordChanged ?? false
    ];
    
    const { rows } = await pgPool.query(query, values);
    const savedUser = rows[0];

    // Invalidate Cache
    try {
      const cacheKey = `user:email:${savedUser.email}:role:${savedUser.role || 'any'}`;
      await redis.del(cacheKey);
    } catch (err) {
      logger.error('[Redis Cache Error]', err);
    }

    return savedUser;
  }

  // Updates multiple users in a single transaction
  async saveMany(users) {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      for (const user of users) {
        const query = `
          INSERT INTO users (id, name, email, password, role, "isActive", "isPasswordChanged")
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE SET
            password = EXCLUDED.password,
            "isPasswordChanged" = EXCLUDED."isPasswordChanged",
            "updatedAt" = CURRENT_TIMESTAMP;
        `;
        const values = [
          user.id || user._id, 
          user.name || 'Unknown', 
          user.email, 
          user.password, 
          user.role, 
          user.isActive ?? true, 
          user.isPasswordChanged ?? false
        ];
        await client.query(query, values);
      }
      await client.query('COMMIT');
      
      // Invalidate Cache for all modified users
      try {
        const pipeline = redis.pipeline();
        for (const user of users) {
          pipeline.del(`user:email:${user.email}:role:${user.role || 'any'}`);
        }
        await pipeline.exec();
      } catch (err) {
        logger.error('[Redis Cache Error]', err);
      }
      
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}
