import fs from 'node:fs';
import path from 'node:path';
import { Router } from './lib/router.js';
import { parseBody, sendJson, sendText } from './lib/http.js';
import { loadDb, saveDb } from './lib/storage.js';
import { verifyToken } from './lib/auth.js';
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

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token');
  res.setHeader('Access-Control-Max-Age', '86400');
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
    setCors(res);

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    if (req.url.startsWith('/uploads/')) {
      return serveUpload(req, res);
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    req.query = Object.fromEntries(url.searchParams.entries());
    req.params = {};
    req.body = {};
    req.user = verifyToken(req.headers.authorization, req.headers['x-auth-token']);

    try {
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

      if (url.pathname.startsWith('/api/admin/')) {
        return sendJson(res, 200, { success: true, count: 0, data: [] });
      }

      return sendJson(res, 404, { error: 'Route not found', path: url.pathname });
    } catch (error) {
      console.error(error);
      return sendJson(res, 500, {
        error: 'Internal server error',
        detail: process.env.NODE_ENV === 'production' ? undefined : error.message
      });
    }
  };
}
