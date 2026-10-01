import { redis } from '../config/redis.js';
import { sendJson } from '../lib/http.js';

const GLOBAL_WINDOW_SECS = 60;
const GLOBAL_MAX_REQUESTS = 300;

const AUTH_WINDOW_SECS = 15 * 60; // 15 minutes
const AUTH_MAX_REQUESTS = 15;      // 15 login attempts per 15 min per IP

const CODE_WINDOW_SECS = 60;
const CODE_MAX_REQUESTS = 20;      // 20 code submissions per min

/**
 * Extract client IP with trusted proxy awareness
 */
export function getClientIp(req) {
  const remote = req.socket?.remoteAddress || '127.0.0.1';
  const isPrivateOrLoopback =
    remote === '127.0.0.1' ||
    remote === '::1' ||
    remote.startsWith('10.') ||
    remote.startsWith('172.16.') ||
    remote.startsWith('172.17.') ||
    remote.startsWith('172.18.') ||
    remote.startsWith('172.19.') ||
    remote.startsWith('172.20.') ||
    remote.startsWith('172.21.') ||
    remote.startsWith('172.22.') ||
    remote.startsWith('172.23.') ||
    remote.startsWith('172.24.') ||
    remote.startsWith('172.25.') ||
    remote.startsWith('172.26.') ||
    remote.startsWith('172.27.') ||
    remote.startsWith('172.28.') ||
    remote.startsWith('172.29.') ||
    remote.startsWith('172.30.') ||
    remote.startsWith('172.31.') ||
    remote.startsWith('192.168.');

  if (isPrivateOrLoopback && req.headers['x-forwarded-for']) {
    const parts = req.headers['x-forwarded-for'].split(',');
    return parts[0].trim();
  }
  return remote;
}

/**
 * Generic Rate Limiting Core Function
 */
async function checkLimit(key, maxRequests, windowSecs, res, customMessage) {
  try {
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, windowSecs, 'NX');
    const [[, requests]] = await pipeline.exec();

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - requests));

    if (requests > maxRequests) {
      const ttl = await redis.ttl(key);
      res.setHeader('Retry-After', ttl);
      sendJson(res, 429, {
        error: 'Too Many Requests',
        message: customMessage || 'Rate limit exceeded. Please try again later.'
      });
      return true;
    }

    return false;
  } catch (err) {
    // Fail open in case of unexpected cache failures
    return false;
  }
}

/**
 * Global HTTP Rate Limiter
 */
export async function rateLimiter(req, res) {
  const ip = getClientIp(req);
  const key = req.user ? `ratelimit:user:${req.user.id}` : `ratelimit:ip:${ip}`;
  return checkLimit(key, GLOBAL_MAX_REQUESTS, GLOBAL_WINDOW_SECS, res);
}

/**
 * Auth Endpoint Specific Rate Limiter (Brute-force protection)
 */
export async function authRateLimiter(req, res) {
  const ip = getClientIp(req);
  const email = (req.body?.email || '').trim().toLowerCase();
  const key = email ? `ratelimit:auth:ip_email:${ip}:${email}` : `ratelimit:auth:ip:${ip}`;
  return checkLimit(
    key,
    AUTH_MAX_REQUESTS,
    AUTH_WINDOW_SECS,
    res,
    'Too many login attempts. Please wait 15 minutes before trying again.'
  );
}

/**
 * Code Execution Submission Rate Limiter
 */
export async function codeRateLimiter(req, res) {
  const ip = getClientIp(req);
  const key = req.user ? `ratelimit:code:user:${req.user.id}` : `ratelimit:code:ip:${ip}`;
  return checkLimit(
    key,
    CODE_MAX_REQUESTS,
    CODE_WINDOW_SECS,
    res,
    'Code execution rate limit exceeded. Please wait a moment before running more code.'
  );
}
