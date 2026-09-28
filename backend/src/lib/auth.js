import crypto from 'node:crypto';
import { config } from '../config.js';

// ─── LRU Token Verification Cache ─────────────────────────────────────────────
// crypto.createHmac() is CPU-heavy. Cache verified tokens to skip repeat
// HMAC computation for the same token (e.g. same user making many requests).
// Max 10,000 entries — auto-evicts oldest when full.
const TOKEN_CACHE_MAX = 10_000;
const tokenCache = new Map(); // token -> { payload, cachedAt }
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// Pre-compute HMAC key once as a Buffer — faster than string operations
const SECRET_KEY = Buffer.from(config.tokenSecret, 'utf8');

function base64Url(input) {
  return Buffer.from(input).toString('base64url');
}

export function signToken(user) {
  const payload = {
    id: user.id || user._id,
    email: user.email,
    role: user.role,
    issuedAt: Date.now(),
    expiresAt: Date.now() + TOKEN_EXPIRY_MS
  };
  const encoded = base64Url(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(encoded)
    .digest('base64url');

  return `${encoded}.${signature}`;
}

export function verifyToken(authorization, xAuthToken) {
  const raw = authorization?.charCodeAt(0) === 66 && authorization.charCodeAt(1) === 101
    ? authorization.slice(7)  // 'Bearer ' fast prefix check
    : xAuthToken;

  if (!raw) return null;

  // ── Cache hit: skip expensive HMAC entirely ──────────────────────────────────
  const cached = tokenCache.get(raw);
  if (cached) {
    if (Date.now() < cached.payload.expiresAt) return cached.payload;
    tokenCache.delete(raw);
    return null;
  }

  // ── Cache miss: verify and store ─────────────────────────────────────────────
  const dotIdx = raw.indexOf('.');
  if (dotIdx === -1) return null;

  const encoded   = raw.slice(0, dotIdx);
  const signature = raw.slice(dotIdx + 1);
  if (!encoded || !signature) return null;

  const expected = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(encoded)
    .digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (payload.expiresAt && Date.now() > payload.expiresAt) return null;

  // Evict oldest entry if cache is full (simple LRU: delete first inserted key)
  if (tokenCache.size >= TOKEN_CACHE_MAX) {
    tokenCache.delete(tokenCache.keys().next().value);
  }
  tokenCache.set(raw, { payload });

  return payload;
}

// Invalidate a specific token (e.g. on logout)
export function invalidateToken(raw) {
  tokenCache.delete(raw);
}

export function publicUser(user) {
  if (!user) return null;
  const raw = typeof user.toObject === 'function'
    ? user.toObject()
    : (user._doc ? { ...user._doc } : { ...user });
  const { password, ...safeUser } = raw;
  return safeUser;
}
