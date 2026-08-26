import fs from 'node:fs';
import path from 'node:path';
import { Router } from './lib/router.js';
import { parseBody, sendJson, sendText } from './lib/http.js';
import { loadDb, saveDb } from './lib/storage.js';
import { verifyToken } from './lib/auth.js';
import { rateLimiter } from './middlewares/rateLimiter.js';
import { logger } from './lib/logger.js';
import { register, httpRequestDurationMicroseconds, httpRequestsTotal } from './lib/metrics.js';
import { config } from './config.js';
import { registerRoutes } from './routes/index.js';
import { registerAtsRoutes } from './modules/ats/routes.js';

const contentTypes = {
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.zip': 'application/zip'
};

function setCors(res, req) {
  // When withCredentials=true, Access-Control-Allow-Origin must be the exact
  // origin — NOT the wildcard '*'. Reflect the incoming Origin header back.
  const requestOrigin = req?.headers?.origin;
  const allowedOrigin =
    process.env.CORS_ORIGIN ||          // production: set this env var
    requestOrigin ||                    // dev: echo the caller's origin
    'http://localhost:5173';            // fallback

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Vary', 'Origin');      // tell proxies the response varies by origin
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  // Online Examination Security Headers (Phase 6)
  res.setHeader('X-Frame-Options', 'DENY');
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

export async function createApp() {
  const router = new Router();
  const ctx = {
    config,
    startedAt: new Date(),
    getDb: loadDb,
    saveDb
  };

  registerRoutes(router, ctx);
  registerAtsRoutes(router);

  return async function app(req, res) {
    setCors(res, req);

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    if (req.url.startsWith('/uploads/')) {
      return serveUpload(req, res);
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const startTime = Date.now();
    let statusCode = 200;
    req.query = Object.fromEntries(url.searchParams.entries());
    req.params = {};
    req.body = {};
    
    // Volume 7: Parse cookies to extract token
    const cookies = {};
    if (req.headers.cookie) {
      req.headers.cookie.split(';').forEach(cookie => {
        const parts = cookie.split('=');
        cookies[parts.shift().trim()] = decodeURI(parts.join('='));
      });
    }
    
    const token = cookies.token || req.headers['x-auth-token'];
    req.user = verifyToken(req.headers.authorization, token);

    try {
      if (url.pathname === '/metrics') {
        res.setHeader('Content-Type', register.contentType);
        const metricsData = await register.metrics();
        return sendText(res, 200, metricsData);
      }

      // Volume 7 Security: Rate Limiting
      const limitExceeded = await rateLimiter(req, res);
      if (limitExceeded) return; // 429 response already sent

      req.body = await parseBody(req);
      const handled = await router.handle(req, res, ctx, url.pathname);

      if (handled) return;

      if (url.pathname === '/' || url.pathname === '/api') {
        return sendJson(res, 200, {
          success: true,
          name: 'MujCode Backend',
          apiBase: '/api',
          uptimeSeconds: Math.floor((Date.now() - ctx.startedAt.getTime()) / 1000)
        });
      }

      return sendJson(res, 404, { error: 'Route not found', path: url.pathname });
    } catch (error) {
      statusCode = error.status || 500;
      if (statusCode >= 500) logger.error(`[AppError] ${error.message}`, { error, path: url.pathname });
      return sendJson(res, statusCode, {
        error: error.message || 'Internal server error',
        detail: process.env.NODE_ENV === 'production' ? undefined : error.stack
      });
    } finally {
      // Record Prometheus Metrics
      const durationMs = Date.now() - startTime;
      httpRequestDurationMicroseconds.labels(req.method, url.pathname, statusCode).observe(durationMs);
      httpRequestsTotal.labels(req.method, url.pathname, statusCode).inc();
      
      logger.info(`${req.method} ${url.pathname} ${statusCode} - ${durationMs}ms`);
    }
  };
}
