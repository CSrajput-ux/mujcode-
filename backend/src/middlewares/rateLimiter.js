import { redis } from '../config/redis.js';
import { sendJson } from '../lib/http.js';

const RATE_LIMIT_WINDOW_SECS = 60;
const MAX_REQUESTS_PER_WINDOW = 100;

/**
 * Redis-backed Fixed Window Rate Limiter
 * Limits requests based on IP address to prevent DDoS and brute-force attacks.
 */
export async function rateLimiter(req, res) {
  try {
    // In a real load-balanced environment, this would be req.headers['x-forwarded-for']
    const ip = req.socket.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
    
    // We can also rate limit based on user ID if authenticated
    const key = req.user ? `ratelimit:user:${req.user.id}` : `ratelimit:ip:${ip}`;
    
    // Increment the request count
    const requests = await redis.incr(key);
    
    // If it's the first request in the window, set the expiration
    if (requests === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW_SECS);
    }
    
    // Add rate limit headers for the client
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
    
    // Continue processing if within limit
    return null;
  } catch (err) {
    console.error('[RateLimiter] Error connecting to Redis:', err.message);
    // Fail open: if Redis is down, we don't want to completely break the API,
    // though in a strict enterprise setting you might want to fail closed.
    return null; 
  }
}
