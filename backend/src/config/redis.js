import { Redis } from 'ioredis';
import { logger } from '../lib/logger.js';

class InMemoryFallbackRedis {
  constructor() {
    this.store = new Map();
    this.ttls = new Map();
  }

  _cleanupKey(key) {
    const expireAt = this.ttls.get(key);
    if (expireAt && Date.now() > expireAt) {
      this.store.delete(key);
      this.ttls.delete(key);
      return true;
    }
    return false;
  }

  async get(key) {
    if (this._cleanupKey(key)) return null;
    const val = this.store.get(key);
    return val !== undefined ? String(val) : null;
  }

  async set(key, val, ...args) {
    this.store.set(key, val);
    if (args[0] === 'EX' && typeof args[1] === 'number') {
      this.ttls.set(key, Date.now() + args[1] * 1000);
    } else if (args[0] === 'PX' && typeof args[1] === 'number') {
      this.ttls.set(key, Date.now() + args[1]);
    }
    return 'OK';
  }

  async incr(key) {
    this._cleanupKey(key);
    const val = Number(this.store.get(key) || 0) + 1;
    this.store.set(key, val);
    return val;
  }

  async expire(key, seconds) {
    if (!this.store.has(key)) return 0;
    this.ttls.set(key, Date.now() + seconds * 1000);
    return 1;
  }

  async ttl(key) {
    if (!this.store.has(key) || this._cleanupKey(key)) return -2;
    const expireAt = this.ttls.get(key);
    if (!expireAt) return -1;
    return Math.max(0, Math.ceil((expireAt - Date.now()) / 1000));
  }

  async del(key) {
    this.ttls.delete(key);
    return this.store.delete(key) ? 1 : 0;
  }

  on() {
    return this;
  }
}

const fallbackStore = new InMemoryFallbackRedis();
const rawRedisUri = process.env.REDIS_URI;

let redisClient = null;
let isRedisAvailable = false;

if (rawRedisUri) {
  try {
    redisClient = new Redis(rawRedisUri, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) return null; // stop reconnecting endlessly if Redis is unreachable
        return Math.min(times * 1000, 3000);
      }
    });

    redisClient.on('connect', () => {
      isRedisAvailable = true;
      logger.info('[Redis] Connected successfully to remote Redis.');
    });

    redisClient.on('error', (err) => {
      isRedisAvailable = false;
      logger.warn(`[Redis] Connection warning: ${err.message || 'unreachable'}. Falling back to in-memory store.`);
    });
  } catch (err) {
    logger.warn(`[Redis] Initialization failed (${err.message}). Using in-memory store.`);
  }
} else {
  logger.info('[Redis] REDIS_URI not configured — running with fast In-Memory cache & rate limiter.');
}

// Transparent Proxy: calls remote Redis if connected, otherwise falls back gracefully to in-memory store
export const redis = new Proxy({}, {
  get(_, prop) {
    if (isRedisAvailable && redisClient && typeof redisClient[prop] === 'function') {
      return async (...args) => {
        try {
          return await redisClient[prop](...args);
        } catch (err) {
          logger.warn(`[Redis] Fallback on ${String(prop)}: ${err.message}`);
          if (typeof fallbackStore[prop] === 'function') {
            return fallbackStore[prop](...args);
          }
          return null;
        }
      };
    }

    if (typeof fallbackStore[prop] === 'function') {
      return fallbackStore[prop].bind(fallbackStore);
    }
    return () => null;
  }
});

