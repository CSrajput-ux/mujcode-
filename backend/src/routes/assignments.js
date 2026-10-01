import fs from 'node:fs';
import path from 'node:path';
import { ok, sendJson } from '../lib/http.js';
import { nextId } from '../lib/ids.js';
import { CloudinaryService } from '../services/CloudinaryService.js';
import { logger } from '../lib/logger.js';
import { requireAuth, requireFaculty } from '../lib/requireAuth.js';

function safeFilename(name) {
  return String(name || 'assignment.pdf')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'assignment.pdf';
}

function isTrustedStorageUrl(fileUrl) {
  if (!fileUrl || typeof fileUrl !== 'string') return false;
  try {
    const parsed = new URL(fileUrl);
    return parsed.protocol === 'https:' && (
      parsed.hostname === 'res.cloudinary.com' ||
      parsed.hostname.endsWith('.cloudinary.com') ||
      parsed.hostname.endsWith('.amazonaws.com')
    );
  } catch {
    return false;
  }
}

export function registerAssignmentsRoutes(router) {
  // Faculty: Apne section ke saare assignments dekho (RESTRICTED TO FACULTY / ADMIN)
  router.get('/api/assignments/faculty/all', (req, res, ctx) => {
    if (!requireFaculty(req, res)) return;
    return sendJson(res, 200, ctx.getDb().assignments || []);
  });

  // Student: Apne section ke pending assignments dekho (AUTHENTICATED)
  router.get('/api/assignments/student/my', (req, res, ctx) => {
    if (!requireAuth(req, res)) return;
    const db = ctx.getDb();
    const userId = req.user.id;
    const student = (db.students || []).find(s => s.id === userId || s.college_id === req.user.college_id)
      || (db.users || []).find(u => u.id === userId && u.role === 'student');

    if (!student) {
      return sendJson(res, 200, []);
    }

    const studentSection = student.section || '';
    const studentBranch = student.branch || '';

    // Filter assignments matching student's section and branch
    const myAssignments = (db.assignments || []).filter(a => {
      const sectionMatch = !a.section || !studentSection ||
        a.section.toUpperCase() === studentSection.toUpperCase();
      const branchMatch = !a.branch || !studentBranch ||
        a.branch.toUpperCase() === studentBranch.toUpperCase();
      return sectionMatch && branchMatch;
    });

    return sendJson(res, 200, myAssignments);
  });

  // Student: Submitted assignments (AUTHENTICATED — ONLY OWN SUBMISSIONS)
  router.get('/api/assignments/student/submitted', (req, res, ctx) => {
    if (!requireAuth(req, res)) return;
    const db = ctx.getDb();
    const userId = String(req.user.id);
    const collegeId = req.user.college_id ? String(req.user.college_id) : null;

    const mySubmissions = (db.assignmentSubmissions || []).filter(sub =>
      String(sub.studentId) === userId || (collegeId && String(sub.studentId) === collegeId)
    );
    return sendJson(res, 200, mySubmissions);
  });

  router.post('/api/assignments/seed', (req, res) => {
    if (!requireFaculty(req, res)) return;
    return ok(res, { message: 'Assignments are already seeded' });
  });

  // Student: Submit an assignment (AUTHENTICATED — FORCED OWN USER ID)
  router.post('/api/assignments/:id/submit', async (req, res, ctx) => {
    if (!requireAuth(req, res)) return;
    const db = ctx.getDb();
    const assignmentId = req.params.id;
    const assignment = (db.assignments || []).find(a => a._id === assignmentId || a.id === assignmentId);

    if (!assignment) {
      return sendJson(res, 404, { error: 'Assignment not found' });
    }

    // Always derive student identity from verified token — NEVER trust client body
    const userId = req.user.id;
    const student = (db.students || []).find(s => s.id === userId || s.college_id === req.user.college_id)
      || (db.users || []).find(u => u.id === userId);

    if (!student) {
      return sendJson(res, 403, { error: 'Student record not found' });
    }

    if (!db.assignmentSubmissions) {
      db.assignmentSubmissions = [];
    }

    const existingIndex = db.assignmentSubmissions.findIndex(sub =>
      (sub.assignmentId === assignmentId) && (String(sub.studentId) === String(userId))
    );

    let fileUrl = '';
    let fileName = '';
    let fileType = '';

    const file = req.body.files?.[0];
    if (file) {
      try {
        fileName = file.filename || 'submission.pdf';
        const safeName = safeFilename(fileName);
        const filename = `${assignmentId}-${userId}-${safeName}`;
        fileUrl = await CloudinaryService.uploadFile(file.buffer, filename, file.contentType || 'application/octet-stream');
        fileType = file.contentType || 'application/pdf';
      } catch (err) {
        logger.error('[AssignmentSubmit] Cloudinary upload error:', err);
        return sendJson(res, 500, { error: 'File upload failed' });
      }
    }

    const submission = {
      _id: nextId('sub'),
      assignmentId,
      studentId: String(userId),
      studentName: student.name || student.fullName || req.user.email || 'Student',
      fileUrl,
      fileName,
      fileType,
      submittedOn: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      grade: 'Pending',
      score: 0,
      title: assignment.title,
      subject: assignment.subject,
      type: assignment.type,
      status: 'Submitted'
    };

    if (existingIndex >= 0) {
      submission._id = db.assignmentSubmissions[existingIndex]._id;
      db.assignmentSubmissions[existingIndex] = submission;
    } else {
      db.assignmentSubmissions.push(submission);
      assignment.completedCount = (assignment.completedCount || 0) + 1;
      assignment.pendingCount = Math.max(0, (assignment.pendingCount || 0) - 1);
    }

    ctx.saveDb(db);
    return sendJson(res, 201, submission);
  });

  // Faculty: Create assignment (RESTRICTED TO FACULTY / ADMIN)
  router.post('/api/assignments', async (req, res, ctx) => {
    if (!requireFaculty(req, res)) return;
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
      createdAt: new Date().toISOString()
    };
    db.assignments.unshift(assignment);
    ctx.saveDb(db);
    return sendJson(res, 201, assignment);
  });

  // Download assignment file (AUTHENTICATED + SSRF-SAFE)
  router.get('/api/assignments/download/:id', async (req, res, ctx) => {
    if (!requireAuth(req, res)) return;
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
        // SSRF Check: only allow trusted storage CDN domains
        if (!isTrustedStorageUrl(item.fileUrl)) {
          return sendJson(res, 400, { error: 'Invalid or untrusted file storage URL' });
        }

        const upstreamRes = await fetch(item.fileUrl);
        if (!upstreamRes.ok) {
          return sendJson(res, 502, { error: 'Failed to retrieve file from storage' });
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
        const buf = Buffer.from(await upstreamRes.arrayBuffer());
        return res.end(buf);
      } else {
        const localPath = path.resolve(process.cwd(), item.fileUrl.replace(/^\/+/, ''));
        if (!localPath.startsWith(process.cwd())) {
          return sendJson(res, 403, { error: 'Access denied' });
        }
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

  // View assignment file inline (AUTHENTICATED + SSRF-SAFE)
  router.get('/api/assignments/view/:id', async (req, res, ctx) => {
    if (!requireAuth(req, res)) return;
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
        if (!isTrustedStorageUrl(item.fileUrl)) {
          return sendJson(res, 400, { error: 'Invalid or untrusted file storage URL' });
        }

        const upstreamRes = await fetch(item.fileUrl);
        if (!upstreamRes.ok) {
          return sendJson(res, 502, { error: 'Failed to retrieve file from storage' });
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
        res.setHeader('Cache-Control', 'private, max-age=3600');
        const buf = Buffer.from(await upstreamRes.arrayBuffer());
        return res.end(buf);
      } else {
        const localPath = path.resolve(process.cwd(), item.fileUrl.replace(/^\/+/, ''));
        if (!localPath.startsWith(process.cwd())) {
          return sendJson(res, 403, { error: 'Access denied' });
        }
        if (fs.existsSync(localPath)) {
          res.statusCode = 200;
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
          return fs.createReadStream(localPath).pipe(res);
        }
        return sendJson(res, 404, { error: 'Local file not found' });
      }
    } catch (err) {
      return sendJson(res, 500, { error: 'Failed to view assignment file' });
    }
  });

  // Faculty: View submissions for an assignment (RESTRICTED TO FACULTY / ADMIN)
  router.get('/api/assignments/:assignmentId/submissions', (req, res, ctx) => {
    if (!requireFaculty(req, res)) return;
    const submissions = (ctx.getDb().assignmentSubmissions || []).filter(sub => sub.assignmentId === req.params.assignmentId);
    return sendJson(res, 200, submissions);
  });

  // Faculty: Grade submission (RESTRICTED TO FACULTY / ADMIN)
  router.post('/api/assignments/submission/:submissionId/grade', (req, res, ctx) => {
    if (!requireFaculty(req, res)) return;
    const db = ctx.getDb();
    const submission = (db.assignmentSubmissions || []).find(item => item._id === req.params.submissionId);
    if (!submission) return sendJson(res, 404, { error: 'Submission not found' });

    submission.marks = Math.max(0, Number(req.body.marks || 0));
    submission.score = submission.marks;
    submission.feedback = String(req.body.feedback || '').slice(0, 2000);
    submission.status = 'Graded';
    submission.gradedBy = req.user.email || req.user.id;
    submission.gradedAt = new Date().toISOString();
    ctx.saveDb(db);

    return sendJson(res, 200, submission);
  });

  // Faculty: Delete assignment (RESTRICTED TO FACULTY / ADMIN)
  router.delete('/api/assignments/:id', (req, res, ctx) => {
    if (!requireFaculty(req, res)) return;
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
