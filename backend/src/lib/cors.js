import { config } from '../config.js';

// Production confirmed domains for MujCode
const PRODUCTION_ALLOWED_DOMAINS = [
  'https://www.mujcode.in',
  'https://mujcode.in'
];

/**
 * Normalizes an origin string (trims whitespace, strips trailing slashes, converts to lowercase)
 */
function normalizeOrigin(origin) {
  if (!origin || typeof origin !== 'string') return '';
  return origin.trim().replace(/\/+$/, '').toLowerCase();
}

/**
 * Returns clean array of explicitly configured origins from CORS_ORIGIN
 */
export function getConfiguredOrigins() {
  const raw = config.corsOrigin || process.env.CORS_ORIGIN || '';
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);
}

/**
 * Checks whether a given origin is allowed under strict CORS policy.
 * 
 * Rules:
 * 1. Rejects null, undefined, or empty origins.
 * 2. Rejects wildcard '*' in production.
 * 3. Exact matching only (no partial substring matching or vulnerable regexes).
 * 4. Checks against comma-separated CORS_ORIGIN env list.
 * 5. Checks against confirmed production domains.
 * 6. In non-production only, allows localhost / 127.0.0.1 exact origins.
 */
export function isAllowedOrigin(origin) {
  if (!origin || typeof origin !== 'string') return false;
  const clean = normalizeOrigin(origin);
  if (!clean || clean === '*') return false;

  const isProd = process.env.NODE_ENV === 'production';
  const configured = getConfiguredOrigins();

  // 1. Exact match against configured origins
  if (configured.includes(clean)) {
    return true;
  }

  // 2. Exact match against production domains
  if (PRODUCTION_ALLOWED_DOMAINS.includes(clean)) {
    return true;
  }

  // 3. Localhost origins (permitted in non-production, or if explicitly in CORS_ORIGIN)
  if (!isProd) {
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(clean)) {
      return true;
    }
  }

  return false;
}

/**
 * Applies strict CORS headers to HTTP response.
 * Credentials are ONLY permitted for strictly verified allowlisted origins.
 */
export function setCorsHeaders(res, req) {
  const requestOrigin = req?.headers?.origin;

  if (requestOrigin && isAllowedOrigin(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token, Accept, Origin, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
}
