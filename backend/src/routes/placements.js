import { ok, sendJson } from '../lib/http.js';
import { enrichApplication, enrichDrive, nextNumericId } from './helpers.js';
import { createApplicationPg, getStudentApplicationsPg, isPostgresConnected } from '../lib/postgres.js';
import { requireAuth, requireAnyRole } from '../lib/requireAuth.js';

export function registerPlacementsRoutes(router) {
  router.get('/api/placements/drives', (req, res, ctx) => {
    const db = ctx.getDb();
    return sendJson(res, 200, db.placementDrives.map(drive => enrichDrive(db, drive)));
  });

  router.post('/api/placements/drives', (req, res, ctx) => {
    if (!requireAnyRole(req, res, 'company', 'admin')) return;
    const db = ctx.getDb();
    const driveId = nextNumericId(db, 'placementDrives');
    const companyId = req.user.role === 'company'
      ? Number(req.user.companyId || req.user.id || 1)
      : Number(req.body.companyId || db.companies[0]?.id || 1);

    const drive = {
      id: driveId,
      _id: `drive_${driveId}`,
      title: req.body.title || 'New Placement Drive',
      companyId,
      academicYearId: Number(req.body.academicYearId || 1),
      driveDate: req.body.driveDate || new Date().toISOString().slice(0, 10),
      description: req.body.description || '',
      status: req.body.status || 'Scheduled'
    };

    db.placementDrives.unshift(drive);

    for (const jobInput of req.body.jobs || []) {
      const jobId = nextNumericId(db, 'jobPostings');
      db.jobPostings.push({
        id: jobId,
        driveId,
        role: jobInput.role || 'Software Engineer',
        ctc: jobInput.ctc || 'N/A',
        locations: jobInput.locations || 'On-campus',
        eligibilityCriteria: jobInput.eligibilityCriteria || {},
        status: 'Open'
      });
    }

    ctx.saveDb(db);
    return sendJson(res, 201, enrichDrive(db, drive));
  });

  router.get('/api/placements/companies', (req, res, ctx) => {
    return sendJson(res, 200, ctx.getDb().companies);
  });

  router.post('/api/placements/apply', async (req, res, ctx) => {
    if (!requireAuth(req, res)) return;
    const db = ctx.getDb();
    const jobId = Number(req.body.jobId);
    if (!jobId || isNaN(jobId)) {
      return sendJson(res, 400, { error: 'Valid jobId is required' });
    }

    // Always derive student identity from verified token
    const studentId = req.user.id || req.user.college_id;

    if (isPostgresConnected()) {
      const result = await createApplicationPg(jobId, studentId);
      if (result) {
        if (result.conflict) {
          return sendJson(res, 409, {
            message: 'Already applied',
            application: enrichApplication(db, result.application || { jobId, studentId, status: 'Applied' })
          });
        }
        return sendJson(res, 201, enrichApplication(db, result.application));
      }
    }

    const existing = db.applications.find(app => app.jobId === jobId && String(app.studentId) === String(studentId));
    if (existing) {
      return sendJson(res, 409, { message: 'Already applied', application: enrichApplication(db, existing) });
    }

    const application = {
      id: nextNumericId(db, 'applications'),
      jobId,
      studentId,
      status: 'Applied',
      appliedAt: new Date().toISOString()
    };

    db.applications.unshift(application);
    ctx.saveDb(db);
    return sendJson(res, 201, enrichApplication(db, application));
  });

  router.get('/api/placements/my-applications', async (req, res, ctx) => {
    if (!requireAuth(req, res)) return;
    const db = ctx.getDb();
    const studentId = req.user.id || req.user.college_id;

    if (isPostgresConnected()) {
      const pgApps = await getStudentApplicationsPg(studentId);
      if (pgApps) {
        return sendJson(res, 200, pgApps.map(app => enrichApplication(db, app)));
      }
    }

    return sendJson(res, 200, db.applications
      .filter(app => String(app.studentId) === String(studentId))
      .map(app => enrichApplication(db, app)));
  });
}

