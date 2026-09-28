import fs from 'node:fs';
import path from 'node:path';
import { Router } from './lib/router.js';
import { parseBody, sendJson, sendText } from './lib/http.js';
import { loadDb, saveDb, loadFaculty, loadStudents } from './lib/storage.js';
import { verifyToken } from './lib/auth.js';
import { rateLimiter } from './middlewares/rateLimiter.js';
import { logger } from './lib/logger.js';
import { register, httpRequestDurationMicroseconds, httpRequestsTotal } from './lib/metrics.js';
import { config } from './config.js';
import { registerRoutes } from './routes/index.js';
import { registerAtsRoutes } from './modules/ats/routes.js';

// ─── Static file types map ─────────────────────────────────────────────────────
const contentTypes = {
  '.pdf':  'application/pdf',
  '.txt':  'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ppt':  'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.doc':  'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.zip':  'application/zip'
};

// ─── Pre-compiled regex patterns (compiled once at startup, NOT per-request) ───
const MULTI_SLASH_RE   = /\/+/g;
const MONGO_ID_RE      = /\/[0-9a-f]{24}(?=\/|$)/gi;
const NUMERIC_ID_RE    = /\/[0-9]+(?=\/|$)/g;
const JOB_TOKEN_RE     = /\/job_[^/]+/g;
const COOKIE_TOKEN_RE  = /(?:^|;\s*)token=([^;]*)/;
const UPLOAD_PREFIX    = '/uploads/';
const METRICS_PATH     = '/metrics';
const API_PATH         = '/api';

// ─── CORS header cache ─────────────────────────────────────────────────────────
// Same origin appears repeatedly — cache computed CORS headers per origin
// to avoid repeated string operations on every request.
const corsCache = new Map();
const CORS_CACHE_MAX = 50;

// Content-Security paths that can be embedded (pre-checked via startsWith set)
const EMBEDDABLE_PREFIXES = ['/api/content/view', '/api/assignments/view', UPLOAD_PREFIX];

function isEmbeddable(url) {
  for (let i = 0; i < EMBEDDABLE_PREFIXES.length; i++) {
    if (url.startsWith(EMBEDDABLE_PREFIXES[i])) return true;
  }
  return false;
}

function setCors(res, req) {
  const requestOrigin = req.headers.origin;
  const allowedOrigin = process.env.CORS_ORIGIN || requestOrigin || 'http://localhost:5173';

  // Cache lookup to avoid repeated setHeader calls for same origin
  let cached = corsCache.get(allowedOrigin);
  if (!cached) {
    cached = allowedOrigin;
    if (corsCache.size >= CORS_CACHE_MAX) {
      corsCache.delete(corsCache.keys().next().value);
    }
    corsCache.set(allowedOrigin, cached);
  }

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (isEmbeddable(req.url)) {
    res.setHeader('Content-Security-Policy', 'frame-ancestors *');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  } else {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'screen-wake-lock=*, camera=*, microphone=*');
}

function serveUpload(req, res) {
  const relative = decodeURIComponent(req.url.split('?')[0].replace(/^\/uploads\//, ''));
  const filePath = path.resolve(config.uploadDir, relative);

  if (!filePath.startsWith(config.uploadDir)) {
    return sendJson(res, 403, { error: 'Forbidden' });
  }
  if (!fs.existsSync(filePath)) {
    return sendText(res, 404, 'File not found');
  }

  const type = contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type });
  fs.createReadStream(filePath).pipe(res);
}

// ─── Fast URL parser — replaces expensive `new URL()` ─────────────────────────
// `new URL()` creates a full URL object with protocol parsing, hostname normalization
// etc. We only need pathname + query string, so we parse manually.
function fastParseUrl(rawUrl) {
  const url = rawUrl || '/';
  const qIdx = url.indexOf('?');
  let pathname, search;

  if (qIdx === -1) {
    pathname = url;
    search   = '';
  } else {
    pathname = url.slice(0, qIdx);
    search   = url.slice(qIdx + 1);
  }

  // Normalize multiple slashes (e.g. //api//foo -> /api/foo)
  if (pathname.includes('//')) {
    pathname = pathname.replace(MULTI_SLASH_RE, '/');
  }
  if (!pathname) pathname = '/';

  return { pathname, search };
}

function parseQueryString(search) {
  if (!search) return {};
  const out = {};
  const pairs = search.split('&');
  for (let i = 0; i < pairs.length; i++) {
    const eq = pairs[i].indexOf('=');
    if (eq === -1) {
      out[decodeURIComponent(pairs[i])] = '';
    } else {
      out[decodeURIComponent(pairs[i].slice(0, eq))] = decodeURIComponent(pairs[i].slice(eq + 1));
    }
  }
  return out;
}

export async function createApp() {
  const router = new Router();
  const ctx = {
    config,
    startedAt: new Date(),
    getDb: loadDb,
    saveDb,
    getFaculty: loadFaculty,
    getStudents: loadStudents
  };

  registerRoutes(router, ctx);
  registerAtsRoutes(router);

  return async function app(req, res) {
    // Attach req so compressedSend() can read Accept-Encoding
    res.req = req;
    setCors(res, req);

    // ── OPTIONS preflight — respond immediately, zero processing ──────────────
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    // ── Static file serving ───────────────────────────────────────────────────
    if (req.url.charCodeAt(1) === 117 && req.url.startsWith(UPLOAD_PREFIX)) {
      // charCodeAt(1) === 'u' fast prefix hint
      return serveUpload(req, res);
    }

    // ── Fast URL parsing (no URL object allocation) ───────────────────────────
    const { pathname, search } = fastParseUrl(req.url);

    const startTime = process.hrtime.bigint(); // nanosecond precision, no GC pressure
    let statusCode = 200;

    req.query  = parseQueryString(search);
    req.params = {};
    req.body   = {};

    // ── Fast cookie token extraction (targeted regex, no full cookie parse) ───
    const cookieHeader = req.headers.cookie;
    const token = cookieHeader
      ? (() => { const m = cookieHeader.match(COOKIE_TOKEN_RE); return m ? decodeURIComponent(m[1]) : null; })()
        || req.headers['x-auth-token']
      : req.headers['x-auth-token'];

    req.user = verifyToken(req.headers.authorization, token);

    try {
      // ── Prometheus metrics endpoint ─────────────────────────────────────────
      if (pathname === METRICS_PATH) {
        res.setHeader('Content-Type', register.contentType);
        return sendText(res, 200, await register.metrics());
      }

      // ── Rate limiting ───────────────────────────────────────────────────────
      const limitExceeded = await rateLimiter(req, res);
      if (limitExceeded) return;

      req.body = await parseBody(req);

      const handled = await router.handle(req, res, ctx, pathname);
      if (handled) return;

      // ── Root / health endpoint ──────────────────────────────────────────────
      if (pathname === '/' || pathname === API_PATH) {
        return sendJson(res, 200, {
          success: true,
          name: 'MujCode Backend',
          apiBase: '/api',
          uptimeSeconds: Math.floor((Date.now() - ctx.startedAt.getTime()) / 1000)
        });
      }

      return sendJson(res, 404, { error: 'Route not found', path: pathname });

    } catch (error) {
      statusCode = error.status || 500;
      if (statusCode >= 500) {
        logger.error(`[AppError] ${error.message}`, { path: pathname });
      }
      return sendJson(res, statusCode, {
        error: error.message || 'Internal server error',
        detail: process.env.NODE_ENV === 'production' ? undefined : error.stack
      });

    } finally {
      // ── Prometheus metrics — sanitize labels to prevent cardinality explosion ──
      const durationMs = Number(process.hrtime.bigint() - startTime) / 1_000_000;

      // Only sanitize if the pathname contains digits (most don't)
      const routeLabel = /\d/.test(pathname)
        ? pathname.replace(MONGO_ID_RE, '/:id').replace(NUMERIC_ID_RE, '/:id').replace(JOB_TOKEN_RE, '/:jobId')
        : pathname;

      httpRequestDurationMicroseconds.labels(req.method, routeLabel, statusCode).observe(durationMs);
      httpRequestsTotal.labels(req.method, routeLabel, statusCode).inc();

      if (durationMs > 1000) {
        logger.warn(`SLOW ${req.method} ${pathname} ${statusCode} - ${durationMs.toFixed(1)}ms`);
      } else {
        logger.info(`${req.method} ${pathname} ${statusCode} - ${durationMs.toFixed(1)}ms`);
      }
    }
  };
}
