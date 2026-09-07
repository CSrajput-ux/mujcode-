import { DashboardController } from './controllers/DashboardController.js';
import { DriveController } from './controllers/DriveController.js';
import { ApplicationController } from './controllers/ApplicationController.js';
import { Drive } from './models/Drive.js';
import { Application } from './models/Application.js';
import { AssessmentController } from './controllers/AssessmentController.js';
import { parseBody, sendJson } from '../../lib/http.js';

export function registerAtsRoutes(router) {
  router.get('/api/v1/company/dashboard/stats', DashboardController.getStats);
  
  router.get('/api/v1/company/drives', DriveController.getAll);
  router.post('/api/v1/company/drives', (req, res) => {
    return DriveController.create(req, res);
  });

  router.get('/api/v1/company/drives/:driveId/applications', ApplicationController.getDriveApplications);
  router.post('/api/v1/company/drives/:driveId/apply', (req, res) => {
    return ApplicationController.applyToDrive(req, res);
  });
  router.patch('/api/v1/company/applications/:id/status', (req, res) => {
    return ApplicationController.updateApplicationStatus(req, res);
  });

  router.get('/api/v1/company/candidates', ApplicationController.getAllCandidates);

  router.get('/api/v1/company/assessments', AssessmentController.getAll);
  router.post('/api/v1/company/assessments', (req, res) => {
    return AssessmentController.create(req, res);
  });

  // Student Facing Routes
  router.get('/api/v1/student/ats/drives', async (req, res) => {
    try {
      const studentId = req.query?.studentId;
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
    return ApplicationController.applyToDrive(req, res);
  });
}
