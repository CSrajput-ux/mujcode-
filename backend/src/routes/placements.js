import { ok, sendJson } from '../lib/http.js';
import { enrichApplication, enrichDrive, nextNumericId } from './helpers.js';

export function registerPlacementsRoutes(router) {
  router.get('/api/placements/drives', (req, res, ctx) => {
    const db = ctx.getDb();
    return sendJson(res, 200, db.placementDrives.map(drive => enrichDrive(db, drive)));
  });

  router.post('/api/placements/drives', (req, res, ctx) => {
    const db = ctx.getDb();
    const driveId = nextNumericId(db, 'placementDrives');
    const drive = {
      id: driveId,
      _id: `drive_${driveId}`,
      title: req.body.title || 'New Placement Drive',
      companyId: Number(req.body.companyId || db.companies[0]?.id || 1),
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

  router.post('/api/placements/apply', (req, res, ctx) => {
    const db = ctx.getDb();
    const jobId = Number(req.body.jobId);
    const studentId = req.user?.id || 'stu_1';

    const existing = db.applications.find(app => app.jobId === jobId && app.studentId === studentId);
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

  router.get('/api/placements/my-applications', (req, res, ctx) => {
    const db = ctx.getDb();
    const studentId = req.user?.id || 'stu_1';
    return sendJson(res, 200, db.applications
      .filter(app => app.studentId === studentId)
      .map(app => enrichApplication(db, app)));
  });
}
