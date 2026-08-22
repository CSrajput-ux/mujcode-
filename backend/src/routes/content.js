import fs from 'node:fs';
import path from 'node:path';
import { ok, sendJson } from '../lib/http.js';
import { nextId } from '../lib/ids.js';
import { currentStudent } from './helpers.js';
import { requireAuth, requireAnyRole } from '../lib/requireAuth.js';
import { S3Service } from '../services/S3Service.js';
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

  router.post('/api/content/upload', async (req, res, ctx) => {
    if (!requireAnyRole(req, res, 'faculty', 'admin')) return;
    const db = ctx.getDb();
    const file = req.body.files?.[0];
    const id = nextId('content');
    let fileUrl = '/uploads/sample-module.txt';
    let fileType = 'text/plain';

    if (file) {
      try {
        const filename = `${id}-${safeFilename(file.filename)}`;
        fileUrl = await S3Service.uploadFile(file.buffer, filename, file.contentType || 'application/octet-stream');
        fileType = file.contentType;
      } catch (err) {
        logger.error('[ContentUpload] S3 Upload Failed', err);
        return sendJson(res, 500, { error: 'Failed to upload file to S3' });
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
