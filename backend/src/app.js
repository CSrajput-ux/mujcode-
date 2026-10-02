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
import { monitorEventLoopDelay } from 'node:perf_hooks';
import { getPostgresPoolStats, auditDatabaseIntegrity } from './lib/postgres.js';
import { getRedisStats } from './config/redis.js';

const eventLoopMonitor = monitorEventLoopDelay({ resolution: 20 });
eventLoopMonitor.enable();

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
const SYNTHETIC_ID_RE  = /\/(usr|stu|fac|adm|sess|att|sub|custom)_[^/]+/gi;
const UUID_RE          = /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/gi;
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

const configuredOrigins = (config.corsOrigin || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim().toLowerCase())
  .filter(Boolean);

const isDev = process.env.NODE_ENV !== 'production';

function isAllowedOrigin(origin) {
  if (!origin) return false;
  const lower = origin.toLowerCase();
  if (configuredOrigins.includes(lower)) return true;
  // Allow localhost only in development mode — never in production
  if (isDev && (
    lower === 'http://localhost:5173' ||
    lower === 'http://localhost:3000' ||
    lower === 'http://127.0.0.1:5173' ||
    lower === 'http://127.0.0.1:3000'
  )) return true;
  return false;
}

function setCors(res, req) {
  const requestOrigin = req.headers.origin;
  const allowed = isAllowedOrigin(requestOrigin);
  const originToSet = allowed ? requestOrigin : (configuredOrigins[0] || 'http://localhost:5173');

  res.setHeader('Access-Control-Allow-Origin', originToSet);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Modern Security Headers (Phase 7)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'screen-wake-lock=*, camera=(), microphone=(), geolocation=()');

  if (isEmbeddable(req.url)) {
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  } else {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' ws: wss: https:; frame-ancestors 'self'; object-src 'none';");
  }
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
  const out = Object.create(null);
  const pairs = search.split('&');
  for (let i = 0; i < pairs.length; i++) {
    const eq = pairs[i].indexOf('=');
    let key, val;
    if (eq === -1) {
      key = decodeURIComponent(pairs[i]);
      val = '';
    } else {
      key = decodeURIComponent(pairs[i].slice(0, eq));
      val = decodeURIComponent(pairs[i].slice(eq + 1));
    }
    // Block prototype pollution & NoSQL injection operator keys
    if (key === '__proto__' || key === 'constructor' || key === 'prototype' || key.startsWith('$')) {
      continue;
    }
    out[key] = val;
  }
  return { ...out };
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

      // ── Detailed System Metrics Endpoint (JSON - Admin Only) ──────────────
      if (pathname === '/api/system/metrics') {
        if (!req.user || req.user.role !== 'admin') {
          return sendJson(res, 403, { error: 'Forbidden: Admin access required' });
        }
        const mem = process.memoryUsage();
        const cpu = process.cpuUsage();
        return sendJson(res, 200, {
          success: true,
          pid: process.pid,
          uptimeSeconds: process.uptime(),
          memory: {
            rssMb: Number((mem.rss / (1024 * 1024)).toFixed(2)),
            heapTotalMb: Number((mem.heapTotal / (1024 * 1024)).toFixed(2)),
            heapUsedMb: Number((mem.heapUsed / (1024 * 1024)).toFixed(2)),
            externalMb: Number((mem.external / (1024 * 1024)).toFixed(2)),
            arrayBuffersMb: Number(((mem.arrayBuffers || 0) / (1024 * 1024)).toFixed(2)),
            rssBytes: mem.rss,
            heapTotalBytes: mem.heapTotal,
            heapUsedBytes: mem.heapUsed,
            externalBytes: mem.external,
            arrayBuffersBytes: mem.arrayBuffers || 0
          },
          cpu: {
            userMicroseconds: cpu.user,
            systemMicroseconds: cpu.system
          },
          eventLoopLagMs: {
            min: Number((eventLoopMonitor.min / 1e6).toFixed(2)),
            max: Number((eventLoopMonitor.max / 1e6).toFixed(2)),
            mean: Number((eventLoopMonitor.mean / 1e6).toFixed(2)),
            p50: Number((eventLoopMonitor.percentile(50) / 1e6).toFixed(2)),
            p90: Number((eventLoopMonitor.percentile(90) / 1e6).toFixed(2)),
            p95: Number((eventLoopMonitor.percentile(95) / 1e6).toFixed(2)),
            p99: Number((eventLoopMonitor.percentile(99) / 1e6).toFixed(2))
          },
          activeHandles: process._getActiveHandles?.()?.length || 0,
          activeRequests: process._getActiveRequests?.()?.length || 0,
          postgres: getPostgresPoolStats(),
          redis: getRedisStats()
        });
      }

      // ── Database Integrity Audit Endpoint (JSON - Admin Only) ───────────────
      if (pathname === '/api/system/reconciliation') {
        if (!req.user || req.user.role !== 'admin') {
          return sendJson(res, 403, { error: 'Forbidden: Admin access required' });
        }
        const audit = await auditDatabaseIntegrity();
        return sendJson(res, 200, audit);
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
        logger.error(`[AppError] ${error.message}`, { path: pathname, stack: error.stack });
      }
      return sendJson(res, statusCode, {
        error: (statusCode >= 500 && config.nodeEnv === 'production') ? 'Internal server error' : (error.message || 'An unexpected error occurred')
      });


    } finally {
      // ── Prometheus metrics — sanitize labels to prevent cardinality explosion ──
      const durationMs = Number(process.hrtime.bigint() - startTime) / 1_000_000;

      // Sanitize routeLabel to prevent Prometheus label cardinality explosion
      const routeLabel = pathname
        .replace(MONGO_ID_RE, '/:id')
        .replace(NUMERIC_ID_RE, '/:id')
        .replace(JOB_TOKEN_RE, '/:jobId')
        .replace(SYNTHETIC_ID_RE, '/:id')
        .replace(UUID_RE, '/:id');

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
