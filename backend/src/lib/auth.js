import crypto from 'node:crypto';
import { config } from '../config.js';
import { redis } from '../config/redis.js';
import { logger } from './logger.js';

// ─── Token Expiration Standards ───────────────────────────────────────────────
export const ACCESS_TOKEN_EXPIRY_MS = 15 * 60 * 1000;          // 15 minutes (short-lived)
export const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days (long-lived)

const ISSUER = 'mujcode';
const AUDIENCE = 'mujcode-app';

// ─── LRU Token Verification Cache ─────────────────────────────────────────────
const TOKEN_CACHE_MAX = 10_000;
const tokenCache = new Map(); // token -> { payload, cachedAt }

// In-memory revoked tokens fallback cache
const revokedTokensMemory = new Map(); // jti -> expiresAt

// Pre-compute HMAC key once as a Buffer
const SECRET_KEY = Buffer.from(config.tokenSecret, 'utf8');

function base64Url(input) {
  return Buffer.from(input).toString('base64url');
}

function base64UrlDecode(str) {
  return Buffer.from(str, 'base64url').toString('utf8');
}

/**
 * Sign an Access Token (15-minute validity, algorithm pinned to HS256)
 */
export function signToken(user, customExpiryMs = ACCESS_TOKEN_EXPIRY_MS) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const payload = {
    id: user.id || user._id,
    email: user.email,
    role: user.role,
    college_id: user.college_id || user.collegeId,
    jti: crypto.randomUUID(),
    iss: ISSUER,
    aud: AUDIENCE,
    type: 'access',
    issuedAt: Date.now(),
    expiresAt: Date.now() + customExpiryMs
  };

  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(signingInput)
    .digest('base64url');

  return `${signingInput}.${signature}`;
}

/**
 * Sign a Refresh Token (7-day validity, algorithm pinned to HS256)
 */
export function signRefreshToken(user) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const payload = {
    id: user.id || user._id,
    email: user.email,
    role: user.role,
    jti: crypto.randomUUID(),
    iss: ISSUER,
    aud: AUDIENCE,
    type: 'refresh',
    issuedAt: Date.now(),
    expiresAt: Date.now() + REFRESH_TOKEN_EXPIRY_MS
  };

  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(signingInput)
    .digest('base64url');

  return `${signingInput}.${signature}`;
}

/**
 * Check if a token has been revoked (by JTI)
 */
export async function isTokenRevoked(jti) {
  if (!jti) return false;

  // Check in-memory fallback first
  const memoryExpiry = revokedTokensMemory.get(jti);
  if (memoryExpiry) {
    if (Date.now() > memoryExpiry) {
      revokedTokensMemory.delete(jti);
    } else {
      return true;
    }
  }

  // Check Redis
  try {
    const revoked = await redis.get(`token:revoked:${jti}`);
    return revoked !== null;
  } catch (err) {
    return false;
  }
}

/**
 * Revoke a token actively (add to blocklist until its natural expiry)
 */
export async function revokeToken(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') return;

  try {
    const parts = rawToken.split('.');
    let payload;

    if (parts.length === 3) {
      payload = JSON.parse(base64UrlDecode(parts[1]));
    } else if (parts.length === 2) {
      payload = JSON.parse(base64UrlDecode(parts[0]));
    }

    if (!payload) return;

    const jti = payload.jti || crypto.createHash('sha256').update(rawToken).digest('hex');
    const remainingSeconds = Math.max(1, Math.ceil(((payload.expiresAt || (Date.now() + 86400000)) - Date.now()) / 1000));

    // Remove from in-memory verification cache
    tokenCache.delete(rawToken);

    // Save to local in-memory fallback map
    revokedTokensMemory.set(jti, Date.now() + remainingSeconds * 1000);

    // Save to Redis blocklist with TTL
    await redis.set(`token:revoked:${jti}`, '1', 'EX', remainingSeconds);
    logger.info(`[Auth] Token revoked successfully (jti: ${jti}, ttl: ${remainingSeconds}s)`);
  } catch (err) {
    logger.error('[Auth] Failed to revoke token:', err.message);
  }
}

/**
 * Synchronous in-memory check for quick validation in verifyToken
 */
function isLocallyRevoked(jti, rawToken) {
  if (jti && revokedTokensMemory.has(jti)) {
    if (Date.now() > revokedTokensMemory.get(jti)) {
      revokedTokensMemory.delete(jti);
      return false;
    }
    return true;
  }
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  if (revokedTokensMemory.has(tokenHash)) {
    if (Date.now() > revokedTokensMemory.get(tokenHash)) {
      revokedTokensMemory.delete(tokenHash);
      return false;
    }
    return true;
  }
  return false;
}

/**
 * Verify a token (Header, Cookie, or parameter)
 *
 * Implements:
 * 1. Algorithm Pinning: ONLY 'HS256' is allowed. Rejects 'none' or any asymmetric alg.
 * 2. Signature verification with constant-time comparison (timingSafeEqual).
 * 3. Issuer and Audience validation.
 * 4. Expiration check.
 * 5. Active token revocation check.
 */
export function verifyToken(authorization, xAuthToken) {
  let raw = null;
  if (authorization) {
    if (authorization.startsWith('Bearer ')) {
      raw = authorization.slice(7).trim();
    } else {
      raw = authorization.trim();
    }
  } else if (xAuthToken) {
    raw = xAuthToken.trim();
  }

  if (!raw) return null;

  // Check cache hit
  const cached = tokenCache.get(raw);
  if (cached) {
    if (Date.now() < cached.payload.expiresAt && !isLocallyRevoked(cached.payload.jti, raw)) {
      return cached.payload;
    }
    tokenCache.delete(raw);
    if (Date.now() >= cached.payload.expiresAt) return null;
  }

  const parts = raw.split('.');

  // Support 3-part standard JWTs and 2-part legacy tokens for migration
  if (parts.length === 3) {
    const [encodedHeader, encodedPayload, signature] = parts;
    if (!encodedHeader || !encodedPayload || !signature) return null;

    // 1. Verify Header & Algorithm Pinning
    let header;
    try {
      header = JSON.parse(base64UrlDecode(encodedHeader));
    } catch {
      return null;
    }

    if (!header || header.alg !== 'HS256') {
      // Reject 'none', RSA, ECDSA, or unapproved algorithms
      return null;
    }

    // 2. Constant-time Signature Verification
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const expected = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(signingInput)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    // 3. Verify Payload Claims
    let payload;
    try {
      payload = JSON.parse(base64UrlDecode(encodedPayload));
    } catch {
      return null;
    }

    // Issuer & Audience check
    if (payload.iss && payload.iss !== ISSUER) return null;
    if (payload.aud && payload.aud !== AUDIENCE) return null;

    // Expiry check
    if (payload.expiresAt && Date.now() > payload.expiresAt) return null;

    // Revocation check
    if (isLocallyRevoked(payload.jti, raw)) return null;

    // Cache valid verification
    if (tokenCache.size >= TOKEN_CACHE_MAX) {
      tokenCache.delete(tokenCache.keys().next().value);
    }
    tokenCache.set(raw, { payload });

    return payload;

  } else if (parts.length === 2) {
    // ── Legacy 2-part token support (${encodedPayload}.${signature}) ──────────
    const [encodedPayload, signature] = parts;
    if (!encodedPayload || !signature) return null;

    const expected = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(encodedPayload)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    let payload;
    try {
      payload = JSON.parse(base64UrlDecode(encodedPayload));
    } catch {
      return null;
    }

    if (payload.expiresAt && Date.now() > payload.expiresAt) return null;
    if (isLocallyRevoked(payload.jti, raw)) return null;

    if (tokenCache.size >= TOKEN_CACHE_MAX) {
      tokenCache.delete(tokenCache.keys().next().value);
    }
    tokenCache.set(raw, { payload });

    return payload;
  }

  return null;
}

export function invalidateToken(raw) {
  revokeToken(raw);
}

export function publicUser(user) {
  if (!user) return null;
  const raw = typeof user.toObject === 'function'
    ? user.toObject()
    : (user._doc ? { ...user._doc } : { ...user });
  const { password, ...safeUser } = raw;
  return safeUser;
}
