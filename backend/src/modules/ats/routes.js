import { DashboardController } from './controllers/DashboardController.js';
import { DriveController } from './controllers/DriveController.js';
import { ApplicationController } from './controllers/ApplicationController.js';
import { Drive } from './models/Drive.js';
import { Application } from './models/Application.js';
import { parseBody, sendJson } from '../../lib/http.js';

export function registerAtsRoutes(router) {
  router.get('/api/v1/company/dashboard/stats', DashboardController.getStats);
  
  router.get('/api/v1/company/drives', DriveController.getAll);
  router.post('/api/v1/company/drives', async (req, res, ctx) => {
    await parseBody(req);
    return DriveController.create(req, res);
  });

  router.get('/api/v1/company/drives/:driveId/applications', ApplicationController.getDriveApplications);
  router.post('/api/v1/company/drives/:driveId/apply', async (req, res, ctx) => {
    await parseBody(req);
    return ApplicationController.applyToDrive(req, res);
  });
  router.patch('/api/v1/company/applications/:id/status', async (req, res, ctx) => {
    await parseBody(req);
    return ApplicationController.updateApplicationStatus(req, res);
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

  router.post('/api/v1/student/ats/drives/:driveId/apply', async (req, res, ctx) => {
    await parseBody(req);
    return ApplicationController.applyToDrive(req, res);
  });
}
