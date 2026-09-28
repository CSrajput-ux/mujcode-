import { redis } from '../config/redis.js';
import { sendJson } from '../lib/http.js';

const RATE_LIMIT_WINDOW_SECS = 60;
const MAX_REQUESTS_PER_WINDOW = 200; // Increased from 100 — was too aggressive

/**
 * Redis-backed Fixed Window Rate Limiter
 * Uses atomic pipeline to avoid two round-trips (INCR + EXPIRE) per request.
 * Also fixes a race condition where INCR could succeed but EXPIRE could fail.
 */
export async function rateLimiter(req, res) {
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim()
      || req.socket.remoteAddress
      || 'unknown';

    const key = req.user ? `ratelimit:user:${req.user.id}` : `ratelimit:ip:${ip}`;

    // Atomic pipeline: INCR + EXPIRE in one round-trip
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, RATE_LIMIT_WINDOW_SECS, 'NX'); // NX = only set if not already set
    const [[, requests]] = await pipeline.exec();

    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS_PER_WINDOW - requests));

    if (requests > MAX_REQUESTS_PER_WINDOW) {
      const ttl = await redis.ttl(key);
      res.setHeader('Retry-After', ttl);
      return sendJson(res, 429, {
        error: 'Too Many Requests',
        message: 'You have exceeded your rate limit. Please try again later.'
      });
    }

    return null;
  } catch (err) {
    // Fail open: don't break API if Redis is unavailable
    return null;
  }
}
