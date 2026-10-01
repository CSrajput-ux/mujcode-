import { DashboardController } from './controllers/DashboardController.js';
import { DriveController } from './controllers/DriveController.js';
import { ApplicationController } from './controllers/ApplicationController.js';
import { Drive } from './models/Drive.js';
import { Application } from './models/Application.js';
import { AssessmentController } from './controllers/AssessmentController.js';
import { sendJson } from '../../lib/http.js';
import { requireAuth, requireAnyRole } from '../../lib/requireAuth.js';
import mongoose from 'mongoose';

export function registerAtsRoutes(router) {
  // Company Portal Routes (Enforce company or admin role)
  router.get('/api/v1/company/dashboard/stats', (req, res) => {
    if (!requireAnyRole(req, res, 'company', 'admin')) return;
    return DashboardController.getStats(req, res);
  });
  
  router.get('/api/v1/company/drives', (req, res) => {
    if (!requireAnyRole(req, res, 'company', 'admin')) return;
    return DriveController.getAll(req, res);
  });

  router.post('/api/v1/company/drives', (req, res) => {
    if (!requireAnyRole(req, res, 'company', 'admin')) return;
    return DriveController.create(req, res);
  });

  router.get('/api/v1/company/drives/:driveId/applications', (req, res) => {
    if (!requireAnyRole(req, res, 'company', 'admin')) return;
    return ApplicationController.getDriveApplications(req, res);
  });

  router.patch('/api/v1/company/applications/:id/status', (req, res) => {
    if (!requireAnyRole(req, res, 'company', 'admin')) return;
    return ApplicationController.updateApplicationStatus(req, res);
  });

  router.get('/api/v1/company/candidates', (req, res) => {
    if (!requireAnyRole(req, res, 'company', 'admin')) return;
    return ApplicationController.getAllCandidates(req, res);
  });

  router.get('/api/v1/company/assessments', (req, res) => {
    if (!requireAnyRole(req, res, 'company', 'admin')) return;
    return AssessmentController.getAll(req, res);
  });

  router.post('/api/v1/company/assessments', (req, res) => {
    if (!requireAnyRole(req, res, 'company', 'admin')) return;
    return AssessmentController.create(req, res);
  });

  // Student Facing Routes (Enforce authentication & derive caller identity)
  router.get('/api/v1/student/ats/drives', async (req, res) => {
    if (!requireAuth(req, res)) return;
    try {
      if (mongoose.connection.readyState !== 1) {
        return sendJson(res, 200, { drives: [], applications: [] });
      }

      const callerId = req.user.id || req.user.college_id;
      const studentId = req.user.role === 'admin' ? (req.query?.studentId || callerId) : callerId;
      const drives = await Drive.find({ status: 'Active' }).populate('companyId', ['name', 'logo', 'industry']);
      
      let applications = [];
      if (studentId) {
        applications = await Application.find({ studentId });
      }
      
      return sendJson(res, 200, { drives, applications });
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

