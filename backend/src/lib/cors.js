import { config } from '../config.js';

// Default trusted domains for MujCode deployments
const DEFAULT_ALLOWED_ORIGINS = [
  'https://www.mujcode.in',
  'https://mujcode.in',
  'http://www.mujcode.in',
  'http://mujcode.in',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000'
];

// Compile list of configured origins
function getConfiguredOrigins() {
  const raw = config.corsOrigin || process.env.CORS_ORIGIN || '';
  return raw
    .split(',')
    .map(o => o.trim().replace(/\/+$/, '').toLowerCase())
    .filter(Boolean);
}

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Checks whether a given origin is allowed under CORS policy.
 * Supports:
 * - Explicit configured origins in CORS_ORIGIN env var
 * - Official MujCode domains (mujcode.in, www.mujcode.in)
 * - Vercel deployment subdomains (*.vercel.app)
 * - Render service subdomains (*.onrender.com)
 * - Localhost origins (in development or if configured)
 */
export function isAllowedOrigin(origin) {
  if (!origin) return false;
  const clean = origin.trim().replace(/\/+$/, '').toLowerCase();

  const configured = getConfiguredOrigins();
  if (configured.includes(clean)) return true;

  if (DEFAULT_ALLOWED_ORIGINS.includes(clean)) return true;

  // Wildcard subdomains for mujcode.in
  if (/^https:\/\/[a-z0-9-]+\.mujcode\.in$/i.test(clean)) return true;

  // Vercel preview and production deployments
  if (/^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.vercel\.app$/i.test(clean)) return true;

  // Render backends / frontends
  if (/^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.onrender\.com$/i.test(clean)) return true;

  // Development localhost
  if (isDev && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(clean)) return true;

  return false;
}

/**
 * Applies comprehensive CORS headers to HTTP response.
 */
export function setCorsHeaders(res, req) {
  const requestOrigin = req.headers.origin;
  const allowed = isAllowedOrigin(requestOrigin);

  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (!requestOrigin) {
    // Non-browser or direct curl request
    const configured = getConfiguredOrigins();
    const fallback = configured[0] || 'https://www.mujcode.in';
    res.setHeader('Access-Control-Allow-Origin', fallback);
  }

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token, Accept, Origin, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
}
