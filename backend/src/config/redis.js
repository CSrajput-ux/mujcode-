import { Redis } from 'ioredis';
import { logger } from '../lib/logger.js';

// ─── High-performance In-Memory Fallback Redis ────────────────────────────────
// Used when REDIS_URI is not set. Synchronous Map operations — zero network I/O.
// pipeline() returns a mock that runs all commands synchronously.
class InMemoryFallbackRedis {
  constructor() {
    this.store = new Map();
    this.ttls  = new Map();
  }

  _isExpired(key) {
    const expireAt = this.ttls.get(key);
    if (expireAt && Date.now() > expireAt) {
      this.store.delete(key);
      this.ttls.delete(key);
      return true;
    }
    return false;
  }

  async get(key) {
    if (this._isExpired(key)) return null;
    const val = this.store.get(key);
    return val !== undefined ? String(val) : null;
  }

  async set(key, val, flagOrEx, seconds) {
    this.store.set(key, val);
    if (flagOrEx === 'EX' && typeof seconds === 'number') {
      this.ttls.set(key, Date.now() + seconds * 1000);
    } else if (flagOrEx === 'PX' && typeof seconds === 'number') {
      this.ttls.set(key, Date.now() + seconds);
    }
    return 'OK';
  }

  async incr(key) {
    this._isExpired(key);
    const val = (Number(this.store.get(key)) || 0) + 1;
    this.store.set(key, val);
    return val;
  }

  async expire(key, seconds, flag) {
    if (!this.store.has(key)) return 0;
    // NX flag: only set expiry if not already set
    if (flag === 'NX' && this.ttls.has(key)) return 0;
    this.ttls.set(key, Date.now() + seconds * 1000);
    return 1;
  }

  async ttl(key) {
    if (!this.store.has(key) || this._isExpired(key)) return -2;
    const expireAt = this.ttls.get(key);
    if (!expireAt) return -1;
    return Math.max(0, Math.ceil((expireAt - Date.now()) / 1000));
  }

  async del(key) {
    this.ttls.delete(key);
    return this.store.delete(key) ? 1 : 0;
  }

  // Pipeline mock: collect commands, execute synchronously on exec()
  pipeline() {
    const commands = [];
    const pipe = {
      incr:   (k)          => { commands.push(['incr',   k]);          return pipe; },
      expire: (k, s, flag) => { commands.push(['expire', k, s, flag]); return pipe; },
      get:    (k)          => { commands.push(['get',    k]);          return pipe; },
      set:    (k, v, f, s) => { commands.push(['set',   k, v, f, s]); return pipe; },
      exec:   async () => {
        const results = [];
        for (const [cmd, ...args] of commands) {
          // Call synchronously on the store — null error prefix for ioredis compat
          let result;
          switch (cmd) {
            case 'incr':   result = await this.incr(...args);   break;
            case 'expire': result = await this.expire(...args); break;
            case 'get':    result = await this.get(...args);    break;
            case 'set':    result = await this.set(...args);    break;
            default:       result = null;
          }
          results.push([null, result]); // [error, value] ioredis format
        }
        return results;
      }
    };
    return pipe;
  }

  on() { return this; }
}

// ─── Real Redis client (when REDIS_URI is set) ────────────────────────────────
const rawRedisUri  = process.env.REDIS_URI;
const fallbackStore = new InMemoryFallbackRedis();

let _client = null; // the real ioredis client or null

if (rawRedisUri) {
  try {
    _client = new Redis(rawRedisUri, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue:   false,
      lazyConnect:          true,
      connectTimeout:       3000,
      commandTimeout:       2000,
      retryStrategy(times) {
        if (times > 5) return null;
        return Math.min(times * 500, 2000);
      }
    });

    _client.on('connect', () => logger.info('[Redis] Connected to remote Redis.'));
    _client.on('ready',   () => {
      _client._healthy = true;
      logger.info('[Redis] Remote Redis client ready.');
    });
    _client.on('error',   (err) => {
      _client._healthy = false;
      logger.warn(`[Redis] Connection/runtime error: ${err.message}`);
    });
    _client.on('close',   () => {
      _client._healthy = false;
    });
    _client.on('reconnecting', () => {
      logger.info('[Redis] Reconnecting to remote Redis...');
    });

    _client._healthy = false;

    // Trigger initial connection asynchronously (lazyConnect: true requires explicit connect call)
    _client.connect().catch((err) => {
      logger.warn(`[Redis] Initial connection deferred (${err.message}). Using in-memory fallback until ready.`);
    });
  } catch (err) {
    logger.warn(`[Redis] Init failed (${err.message}). Using in-memory fallback.`);
    _client = null;
  }
} else {
  logger.info('[Redis] REDIS_URI not set — using fast in-memory fallback.');
}

// ─── Direct export — NO Proxy overhead ───────────────────────────────────────
// Instead of a Proxy that re-creates a function wrapper on every property access,
// we export an object with pre-bound methods that switch at call time.
// This eliminates Proxy trap overhead on every single Redis call.

function makeMethod(methodName) {
  return async function (...args) {
    if (_client && _client._healthy) {
      try {
        return await _client[methodName](...args);
      } catch (err) {
        logger.warn(`[Redis] Fallback on ${methodName}: ${err.message}`);
        return fallbackStore[methodName]?.(...args) ?? null;
      }
    }
    return fallbackStore[methodName]?.(...args) ?? null;
  };
}

function pipelineMethod() {
  if (_client && _client._healthy) {
    try {
      const realPipe = _client.pipeline();
      const origExec = realPipe.exec.bind(realPipe);
      realPipe.exec = async () => {
        try {
          return await origExec();
        } catch (err) {
          logger.warn(`[Redis] Remote pipeline exec error (${err.message}). Falling back to in-memory.`);
          // If remote pipeline fails, return empty result or fallback
          return [];
        }
      };
      return realPipe;
    } catch {
      // fall through
    }
  }
  return fallbackStore.pipeline();
}

export const redis = {
  get:      makeMethod('get'),
  set:      makeMethod('set'),
  incr:     makeMethod('incr'),
  expire:   makeMethod('expire'),
  ttl:      makeMethod('ttl'),
  del:      makeMethod('del'),
  pipeline: pipelineMethod,
};

export function getRawRedisClient() {
  return _client;
}

export async function closeRedis() {
  if (_client) {
    try {
      _client.disconnect();
      _client._healthy = false;
    } catch {}
  }
}

export function getRedisStats() {
  const isRemote = Boolean(_client && _client._healthy);
  return {
    mode: isRemote ? 'remote' : 'in-memory-fallback',
    isRemoteConnected: isRemote,
    status: _client ? _client.status : 'disabled',
    inMemoryKeysCount: fallbackStore.store.size
  };
}
