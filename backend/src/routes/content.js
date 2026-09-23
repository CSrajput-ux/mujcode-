import fs from 'node:fs';
import path from 'node:path';
import { ok, sendJson } from '../lib/http.js';
import { nextId } from '../lib/ids.js';
import { currentStudent } from './helpers.js';
import { requireAuth, requireAnyRole } from '../lib/requireAuth.js';
import { CloudinaryService } from '../services/CloudinaryService.js';
import { logger } from '../lib/logger.js';

function safeFilename(name) {
  return String(name || 'upload.bin')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'upload.bin';
}

export function registerContentRoutes(router) {
  router.get('/api/content', (req, res, ctx) => {
    const db = ctx.getDb();
    let content = db.content;

    const student = currentStudent(db, req);
    if (student && req.user?.role === 'student') {
      const sec = (student.section || 'A').replace(/^Section\s+/i, '').trim().toUpperCase();
      content = content.filter(item => {
        if (!item.section || item.section === 'All') return true;
        const itemSec = String(item.section).replace(/^Section\s+/i, '').trim().toUpperCase();
        return itemSec === sec;
      });
    }

    for (const key of ['section', 'subject', 'type']) {
      if (req.query[key]) {
        if (key === 'subject') {
          content = content.filter(item => (item.subject || '').trim().toLowerCase() === String(req.query.subject || '').trim().toLowerCase());
        } else {
          content = content.filter(item => String(item[key]) === String(req.query[key]));
        }
      }
    }

    return sendJson(res, 200, content);
  });

  // View file inline (perfect for PDF preview modal, images, docs)
  router.get('/api/content/view/:id', async (req, res, ctx) => {
    const db = ctx.getDb();
    const item = (db.content || []).find(c => c._id === req.params.id);
    if (!item || !item.fileUrl) {
      return sendJson(res, 404, { error: 'Content file not found' });
    }

    try {
      const ext = path.extname(item.fileName || item.fileUrl || '').toLowerCase();
      let contentType = item.fileType;
      if (!contentType || contentType === 'application/octet-stream') {
        if (ext === '.pdf') contentType = 'application/pdf';
        else if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
        else if (ext === '.png') contentType = 'image/png';
        else if (ext === '.mp4') contentType = 'video/mp4';
        else if (['.ppt', '.pptx'].includes(ext)) contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        else contentType = 'application/pdf';
      }

      const safeName = (item.fileName || `${item.title || 'document'}${ext || '.pdf'}`).replace(/[^\w.-]/g, '_');

      if (item.fileUrl.startsWith('http://') || item.fileUrl.startsWith('https://')) {
        const upstreamRes = await fetch(item.fileUrl);
        if (!upstreamRes.ok) {
          logger.error(`[ContentView] Failed to fetch upstream file: ${upstreamRes.status}`);
          return sendJson(res, 502, { error: 'Failed to retrieve file from CDN' });
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        const buf = Buffer.from(await upstreamRes.arrayBuffer());
        return res.end(buf);
      } else {
        const localPath = path.join(process.cwd(), item.fileUrl.replace(/^\/+/, ''));
        if (fs.existsSync(localPath)) {
          res.statusCode = 200;
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
          res.setHeader('Access-Control-Allow-Origin', '*');
          return fs.createReadStream(localPath).pipe(res);
        }
        return sendJson(res, 404, { error: 'Local file not found' });
      }
    } catch (err) {
      logger.error('[ContentView] Error serving content view:', err);
      return sendJson(res, 500, { error: 'Internal server error while viewing file' });
    }
  });

  // Download file with proper original filename and extension
  router.get('/api/content/download/:id', async (req, res, ctx) => {
    const db = ctx.getDb();
    const item = (db.content || []).find(c => c._id === req.params.id);
    if (!item || !item.fileUrl) {
      return sendJson(res, 404, { error: 'Content file not found' });
    }

    try {
      let ext = path.extname(item.fileName || item.fileUrl || '').toLowerCase();
      if (!ext) {
        if (item.fileType === 'application/pdf') ext = '.pdf';
        else if (item.fileType?.includes('presentation')) ext = '.pptx';
        else if (item.fileType?.includes('word')) ext = '.docx';
        else if (item.fileType?.startsWith('image/')) ext = '.png';
        else ext = '.pdf';
      }

      const cleanTitle = (item.title || 'document').replace(/[^\w\s.-]/g, '').trim().replace(/\s+/g, '_');
      const downloadName = item.fileName && item.fileName.includes('.') 
        ? item.fileName 
        : (cleanTitle.toLowerCase().endsWith(ext) ? cleanTitle : `${cleanTitle}${ext}`);

      let contentType = item.fileType || 'application/octet-stream';

      if (item.fileUrl.startsWith('http://') || item.fileUrl.startsWith('https://')) {
        const upstreamRes = await fetch(item.fileUrl);
        if (!upstreamRes.ok) {
          return sendJson(res, 502, { error: 'Failed to retrieve file from CDN' });
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
        res.setHeader('Access-Control-Allow-Origin', '*');
        const buf = Buffer.from(await upstreamRes.arrayBuffer());
        return res.end(buf);
      } else {
        const localPath = path.join(process.cwd(), item.fileUrl.replace(/^\/+/, ''));
        if (fs.existsSync(localPath)) {
          res.statusCode = 200;
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
          return fs.createReadStream(localPath).pipe(res);
        }
        return sendJson(res, 404, { error: 'Local file not found' });
      }
    } catch (err) {
      logger.error('[ContentDownload] Error downloading content:', err);
      return sendJson(res, 500, { error: 'Internal server error while downloading file' });
    }
  });

  router.post('/api/content/upload', async (req, res, ctx) => {
    if (!requireAnyRole(req, res, 'faculty', 'admin')) return;
    const db = ctx.getDb();
    const file = req.body.files?.[0];
    const id = nextId('content');
    let fileUrl = '/uploads/sample-module.txt';
    let fileType = 'text/plain';
    let fileName = 'sample-module.txt';

    if (file) {
      try {
        fileName = file.filename || 'document.pdf';
        const filename = `${id}-${safeFilename(fileName)}`;
        fileUrl = await CloudinaryService.uploadFile(file.buffer, filename, file.contentType || 'application/octet-stream');
        fileType = file.contentType || 'application/pdf';
      } catch (err) {
        logger.error('[ContentUpload] Cloudinary Upload Failed', err);
        return sendJson(res, 500, { error: 'Failed to upload file to Cloudinary' });
      }
    }

    const item = {
      _id: id,
      title: req.body.title || 'Untitled Content',
      description: req.body.description || '',
      type: req.body.type || 'module',
      subject: req.body.subject || 'General',
      section: req.body.section || 'A',
      fileUrl,
      fileType,
      fileName,
      uploadedBy: req.user?.email || 'Faculty',
      createdAt: new Date().toISOString()
    };

    db.content.unshift(item);
    ctx.saveDb(db);
    return sendJson(res, 201, item);
  });

  router.delete('/api/content/:id', (req, res, ctx) => {
    if (!requireAnyRole(req, res, 'faculty', 'admin')) return;
    const db = ctx.getDb();
    db.content = db.content.filter(item => item._id !== req.params.id);
    ctx.saveDb(db);
    return ok(res, { message: 'Content deleted' });
  });
}
