import fs from 'node:fs';
import path from 'node:path';
import { ok, sendJson } from '../lib/http.js';
import { nextId } from '../lib/ids.js';

function safeFilename(name) {
  return String(name || 'upload.bin')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'upload.bin';
}

export function registerContentRoutes(router) {
  router.get('/api/content', (req, res, ctx) => {
    let content = ctx.getDb().content;
    for (const key of ['section', 'subject', 'type']) {
      if (req.query[key]) {
        content = content.filter(item => item[key] === req.query[key]);
      }
    }

    return sendJson(res, 200, content);
  });

  router.post('/api/content/upload', (req, res, ctx) => {
    const db = ctx.getDb();
    const file = req.body.files?.[0];
    const id = nextId('content');
    let fileUrl = '/uploads/sample-module.txt';
    let fileType = 'text/plain';

    if (file) {
      const filename = `${id}-${safeFilename(file.filename)}`;
      const target = path.join(ctx.config.uploadDir, filename);
      fs.mkdirSync(ctx.config.uploadDir, { recursive: true });
      fs.writeFileSync(target, file.buffer);
      fileUrl = `/uploads/${filename}`;
      fileType = file.contentType;
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
    const db = ctx.getDb();
    db.content = db.content.filter(item => item._id !== req.params.id);
    ctx.saveDb(db);
    return ok(res, { message: 'Content deleted' });
  });
}
