import { DashboardController } from './controllers/DashboardController.js';
import { DriveController } from './controllers/DriveController.js';
import { ApplicationController } from './controllers/ApplicationController.js';
import { Drive } from './models/Drive.js';
import { Application } from './models/Application.js';
import { AssessmentController } from './controllers/AssessmentController.js';
import { sendJson } from '../../lib/http.js';
import { requireAuth, requireAnyRole } from '../../lib/requireAuth.js';
import { loadDb } from '../../lib/storage.js';
import mongoose from 'mongoose';

export function registerAtsRoutes(router) {
  // Company Portal Routes (Enforce company, admin, or faculty role)
  router.get('/api/v1/company/dashboard/stats', (req, res) => {
    if (!requireAnyRole(req, res, 'company', 'admin', 'faculty')) return;
    return DashboardController.getStats(req, res);
  });
  
  router.get('/api/v1/company/drives', (req, res) => {
    if (!requireAnyRole(req, res, 'company', 'admin', 'faculty')) return;
    return DriveController.getAll(req, res);
  });

  router.post('/api/v1/company/drives', (req, res) => {
    if (!requireAnyRole(req, res, 'company', 'admin', 'faculty')) return;
    return DriveController.create(req, res);
  });

  router.get('/api/v1/company/drives/:driveId/applications', (req, res) => {
    if (!requireAnyRole(req, res, 'company', 'admin', 'faculty')) return;
    return ApplicationController.getDriveApplications(req, res);
  });

  router.patch('/api/v1/company/applications/:id/status', (req, res) => {
    if (!requireAnyRole(req, res, 'company', 'admin', 'faculty')) return;
    return ApplicationController.updateApplicationStatus(req, res);
  });

  router.get('/api/v1/company/candidates', (req, res) => {
    if (!requireAnyRole(req, res, 'company', 'admin', 'faculty')) return;
    return ApplicationController.getAllCandidates(req, res);
  });

  router.get('/api/v1/company/assessments', (req, res) => {
    if (!requireAnyRole(req, res, 'company', 'admin', 'faculty')) return;
    return AssessmentController.getAll(req, res);
  });

  router.post('/api/v1/company/assessments', (req, res) => {
    if (!requireAnyRole(req, res, 'company', 'admin', 'faculty')) return;
    return AssessmentController.create(req, res);
  });

  // Student Facing Routes (Enforce authentication & derive caller identity)
  router.get('/api/v1/student/ats/drives', async (req, res) => {
    if (!requireAuth(req, res)) return;
    try {
      const db = loadDb();
      const callerId = req.user?.id || req.user?.college_id;
      const studentId = req.user?.role === 'admin' ? (req.query?.studentId || callerId) : callerId;
      
      let drives = [];
      let applications = [];

      const DUMMY_DRIVE_TITLES = new Set([
        'software engineer intern (step)',
        'software engineering career loop',
        'aws cloud support associate',
        'product engineer - creative cloud',
        'microsoft 2026 campus recruitment',
        'infosys digital specialist hiring'
      ]);

      // 1. Fetch from Mongo if active
      if (mongoose.connection.readyState === 1) {
        try {
          const rawMongoDrives = await Drive.find({ status: 'Active' }).populate('companyId', ['name', 'logo', 'industry']).lean();
          drives = rawMongoDrives.filter(d => !DUMMY_DRIVE_TITLES.has(String(d.title || '').trim().toLowerCase()));
          if (studentId) {
            applications = await Application.find({ studentId }).lean();
          }
        } catch (mErr) {
          console.error('[StudentDrives] Mongo query error:', mErr.message);
        }
      }

      // 2. Build map and merge placementDrives
      const driveMap = new Map();
      for (const d of drives) {
        if (DUMMY_DRIVE_TITLES.has(String(d.title || '').trim().toLowerCase())) continue;
        const key = String(d._id || d.id);
        const comp = (db.companies || []).find(c =>
          String(c.id) === String(d.companyId?._id || d.companyId?.id || d.companyId) ||
          c._id === (d.companyId?._id || d.companyId) ||
          c.name?.toLowerCase() === d.companyId?.name?.toLowerCase()
        );
        const companyObj = comp ? {
          _id: comp._id || `comp_${comp.id}`,
          id: comp.id,
          name: comp.name,
          logo: comp.logoUrl || comp.logo || d.companyId?.logo || '',
          industry: comp.industry || d.companyId?.industry || 'Technology'
        } : (d.companyId && typeof d.companyId === 'object' && d.companyId.name ? d.companyId : {
          name: d.companyName || 'Corporate Partner',
          logo: '',
          industry: 'Technology'
        });

        driveMap.set(key, {
          ...d,
          companyId: companyObj,
          companyName: companyObj.name
        });
      }

      const placementDrives = Array.isArray(db.placementDrives) ? db.placementDrives : [];
      for (const d of placementDrives) {
        if (d.status && d.status !== 'Active' && d.status !== 'Scheduled' && d.status !== 'Ongoing') continue;
        if (DUMMY_DRIVE_TITLES.has(String(d.title || '').trim().toLowerCase())) continue;
        const key = String(d._id || d.id);
        if (!driveMap.has(key)) {
          const comp = (db.companies || []).find(c =>
            String(c.id) === String(d.companyId) || c._id === d.companyId || (d.companyName && c.name?.toLowerCase() === d.companyName.toLowerCase())
          );
          const companyObj = comp ? {
            _id: comp._id || `comp_${comp.id}`,
            id: comp.id,
            name: comp.name,
            logo: comp.logoUrl || comp.logo || '',
            industry: comp.industry || 'Technology'
          } : {
            name: d.companyName || 'Corporate Partner',
            logo: '',
            industry: 'Technology'
          };

          driveMap.set(key, {
            ...d,
            _id: d._id || `drive_${d.id}`,
            companyId: typeof d.companyId === 'object' && d.companyId?.name ? d.companyId : companyObj,
            companyName: companyObj.name,
            salary: d.salary || { ctc: d.ctc || '' },
            eligibility: d.eligibility || { minCgpa: d.minCgpa || 0, maxBacklogs: d.maxBacklogs || 0, branches: d.branches || [] },
            locationType: d.locationType || 'On-Site',
            location: d.location || '',
            deadline: d.deadline || new Date(Date.now() + 14 * 86400000).toISOString(),
            status: d.status || 'Active',
            applicantsCount: d.applicantsCount || 0
          });
        }
      }

      // 3. Merge applications
      const rawApps = db.applications || db.placementApplications || [];
      const userRawApps = rawApps.filter(a => String(a.studentId) === String(studentId));
      for (const a of userRawApps) {
        const key = String(a._id || a.id);
        if (!applications.some(app => String(app._id || app.id) === key)) {
          applications.push({
            ...a,
            driveId: a.driveId || a.jobId
          });
        }
      }

      return sendJson(res, 200, { drives: Array.from(driveMap.values()), applications });
    } catch (e) {
      console.error('[StudentDrives]', e);
      return sendJson(res, 500, { error: 'Failed to load' });
    }
  });

  router.post('/api/v1/student/ats/drives/:driveId/apply', (req, res) => {
    if (!requireAuth(req, res)) return;
    return ApplicationController.applyToDrive(req, res);
  });
}


