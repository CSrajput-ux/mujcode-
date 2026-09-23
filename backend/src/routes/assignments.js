import fs from 'node:fs';
import path from 'node:path';
import { ok, sendJson } from '../lib/http.js';
import { nextId } from '../lib/ids.js';
import { CloudinaryService } from '../services/CloudinaryService.js';
import { logger } from '../lib/logger.js';

function safeFilename(name) {
  return String(name || 'assignment.pdf')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'assignment.pdf';
}

export function registerAssignmentsRoutes(router) {
  // Faculty: Apne section ke saare assignments dekho
  router.get('/api/assignments/faculty/all', (req, res, ctx) => {
    return sendJson(res, 200, ctx.getDb().assignments);
  });

  // Student: Apne section ke pending assignments dekho
  router.get('/api/assignments/student/my', (req, res, ctx) => {
    const db = ctx.getDb();
    // Try to get student info from auth token
    const userId = req.user?.id || req.user?.college_id;
    const student = db.students.find(s => s.id === userId || s.college_id === userId)
      || db.users.find(u => u.id === userId && u.role === 'student');

    if (!student) {
      // Return all assignments if student not found (fallback)
      return sendJson(res, 200, db.assignments);
    }

    const studentSection = student.section || '';
    const studentBranch = student.branch || '';

    // Filter assignments matching student's section and branch
    const myAssignments = db.assignments.filter(a => {
      const sectionMatch = !a.section || !studentSection || 
        a.section.toUpperCase() === studentSection.toUpperCase();
      const branchMatch = !a.branch || !studentBranch || 
        a.branch.toUpperCase() === studentBranch.toUpperCase();
      return sectionMatch && branchMatch;
    });

    return sendJson(res, 200, myAssignments);
  });

  // Student: Submitted assignments
  router.get('/api/assignments/student/submitted', (req, res, ctx) => {
    const db = ctx.getDb();
    const userId = req.user?.id || req.user?.college_id;
    const mySubmissions = db.assignmentSubmissions.filter(sub => 
      sub.studentId === userId || sub.studentId === String(userId)
    );
    return sendJson(res, 200, mySubmissions);
  });

  router.post('/api/assignments/seed', (req, res) => {
    return ok(res, { message: 'Assignments are already seeded' });
  });

  router.post('/api/assignments', async (req, res, ctx) => {
    const db = ctx.getDb();
    const id = nextId('asgn');
    let fileUrl = req.body.fileUrl || '';
    let fileName = req.body.fileName || '';
    let fileType = req.body.fileType || '';

    const file = req.body.files?.[0];
    if (file) {
      try {
        fileName = file.filename || 'assignment.pdf';
        const filename = `${id}-${safeFilename(fileName)}`;
        fileUrl = await CloudinaryService.uploadFile(file.buffer, filename, file.contentType || 'application/octet-stream');
        fileType = file.contentType || 'application/pdf';
      } catch (err) {
        logger.error('[AssignmentUpload] Cloudinary upload error:', err);
      }
    }

    const assignment = {
      _id: id,
      title: req.body.title || 'New Assignment',
      description: req.body.description || '',
      type: req.body.type || 'Assignment',
      subject: req.body.subject || 'General',
      year: req.body.year || '2',
      branch: req.body.branch || 'CSE',
      section: req.body.section || 'A',
      dueDate: req.body.dueDate || new Date().toISOString().slice(0, 10),
      totalMarks: Number(req.body.totalMarks || 30),
      completedCount: 0,
      pendingCount: (db.students || []).length,
      totalStudents: (db.students || []).length,
      fileUrl,
      fileName,
      fileType,
      createdAt: new Date().toISOString(),
    };
    db.assignments.unshift(assignment);
    ctx.saveDb(db);
    return sendJson(res, 201, assignment);
  });

  // Download assignment file
  router.get('/api/assignments/download/:id', async (req, res, ctx) => {
    const db = ctx.getDb();
    const item = (db.assignments || []).find(a => a._id === req.params.id || a.id === req.params.id);
    if (!item || !item.fileUrl) {
      return sendJson(res, 404, { error: 'Assignment file not found' });
    }

    try {
      let ext = path.extname(item.fileName || item.fileUrl || '').toLowerCase();
      if (!ext) {
        if (item.fileType === 'application/pdf') ext = '.pdf';
        else if (item.fileType?.includes('presentation')) ext = '.pptx';
        else if (item.fileType?.includes('word')) ext = '.docx';
        else ext = '.pdf';
      }

      const cleanTitle = (item.title || 'assignment').replace(/[^\w\s.-]/g, '').trim().replace(/\s+/g, '_');
      const downloadName = item.fileName && item.fileName.includes('.')
        ? item.fileName
        : (cleanTitle.toLowerCase().endsWith(ext) ? cleanTitle : `${cleanTitle}${ext}`);

      let contentType = item.fileType || 'application/pdf';

      if (item.fileUrl.startsWith('http://') || item.fileUrl.startsWith('https://')) {
        const upstreamRes = await fetch(item.fileUrl);
        if (!upstreamRes.ok) {
          return sendJson(res, 502, { error: 'Failed to retrieve file from storage' });
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
      return sendJson(res, 500, { error: 'Failed to download assignment file' });
    }
  });

  // View assignment file inline
  router.get('/api/assignments/view/:id', async (req, res, ctx) => {
    const db = ctx.getDb();
    const item = (db.assignments || []).find(a => a._id === req.params.id || a.id === req.params.id);
    if (!item || !item.fileUrl) {
      return sendJson(res, 404, { error: 'Assignment file not found' });
    }

    try {
      const ext = path.extname(item.fileName || item.fileUrl || '').toLowerCase();
      let contentType = item.fileType || (ext === '.pdf' ? 'application/pdf' : 'application/octet-stream');
      const safeName = (item.fileName || `${item.title || 'assignment'}${ext || '.pdf'}`).replace(/[^\w.-]/g, '_');

      if (item.fileUrl.startsWith('http://') || item.fileUrl.startsWith('https://')) {
        const upstreamRes = await fetch(item.fileUrl);
        if (!upstreamRes.ok) {
          return sendJson(res, 502, { error: 'Failed to retrieve file from storage' });
        }
        res.statusCode = 200;
        res.removeHeader('X-Frame-Options');
        res.setHeader('Content-Security-Policy', "frame-ancestors *");
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
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
          res.removeHeader('X-Frame-Options');
          res.setHeader('Content-Security-Policy', "frame-ancestors *");
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
          res.setHeader('Access-Control-Allow-Origin', '*');
          return fs.createReadStream(localPath).pipe(res);
        }
        return sendJson(res, 404, { error: 'Local file not found' });
      }
    } catch (err) {
      return sendJson(res, 500, { error: 'Failed to view assignment file' });
    }
  });

  router.get('/api/assignments/:assignmentId/submissions', (req, res, ctx) => {
    const submissions = ctx.getDb().assignmentSubmissions.filter(sub => sub.assignmentId === req.params.assignmentId);
    return sendJson(res, 200, submissions);
  });

  router.post('/api/assignments/submission/:submissionId/grade', (req, res, ctx) => {
    const db = ctx.getDb();
    const submission = db.assignmentSubmissions.find(item => item._id === req.params.submissionId);
    if (!submission) return sendJson(res, 404, { error: 'Submission not found' });

    submission.marks = Number(req.body.marks || 0);
    submission.feedback = req.body.feedback || '';
    submission.status = 'Graded';
    ctx.saveDb(db);

    return sendJson(res, 200, submission);
  });

  router.delete('/api/assignments/:id', (req, res, ctx) => {
    const db = ctx.getDb();
    const id = req.params.id;
    db.assignments = (db.assignments || []).filter(item => item._id !== id && item.id !== id);
    if (db.assignmentSubmissions) {
      db.assignmentSubmissions = db.assignmentSubmissions.filter(sub => sub.assignmentId !== id);
    }
    ctx.saveDb(db);
    return ok(res, { message: 'Assignment deleted successfully' });
  });
}

