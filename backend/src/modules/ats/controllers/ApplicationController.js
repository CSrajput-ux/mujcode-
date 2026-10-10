import { Application } from '../models/Application.js';
import { Drive } from '../models/Drive.js';
import { Company } from '../models/Company.js';
import { EligibilityEngine } from '../services/EligibilityEngine.js';
import { sendJson } from '../../../lib/http.js';
import { loadDb, saveDb } from '../../../lib/storage.js';
import mongoose from 'mongoose';

export class ApplicationController {
  static async getDriveApplications(req, res) {
    try {
      const { driveId } = req.params;
      if (!driveId) {
        return sendJson(res, 400, { error: 'Drive ID is required' });
      }

      let applications = [];
      if (mongoose.connection.readyState === 1) {
        try {
          applications = await Application.find({ driveId }).sort({ createdAt: -1 });
        } catch (mErr) {
          console.error('[ApplicationController.getDriveApplications] Mongo err:', mErr.message);
        }
      }

      if (!applications || applications.length === 0) {
        const db = loadDb();
        applications = (db.applications || []).filter(a => String(a.driveId) === String(driveId) || String(a.jobId) === String(driveId));
      }

      return sendJson(res, 200, { applications: applications || [] });
    } catch (error) {
      console.error('[ApplicationController.getDriveApplications]', error);
      return sendJson(res, 500, { error: 'Failed to fetch applications' });
    }
  }

  static async getAllCandidates(req, res) {
    try {
      let companyDrives = [];
      const companyId = req.user?.companyId || req.user?.id;
      if (req.user?.role === 'admin') {
        if (mongoose.connection.readyState === 1) {
          try {
            companyDrives = await Drive.find({}, '_id title');
          } catch {}
        }
      } else if (companyId) {
        if (mongoose.connection.readyState === 1) {
          try {
            companyDrives = await Drive.find({ companyId }, '_id title');
          } catch {}
        }
      }

      const db = loadDb();
      if (!companyDrives || companyDrives.length === 0) {
        const raw = db.placementDrives || [];
        companyDrives = raw.filter(d => req.user?.role === 'admin' || !companyId || String(d.companyId) === String(companyId));
      }

      const driveIds = companyDrives.map(d => String(d._id || d.id));
      if (driveIds.length === 0) {
        return sendJson(res, 200, { candidates: [] });
      }

      let applications = [];
      if (mongoose.connection.readyState === 1) {
        try {
          applications = await Application.find({ driveId: { $in: driveIds } })
            .populate('driveId', 'title role')
            .sort({ createdAt: -1 });
        } catch {}
      }

      if (!applications || applications.length === 0) {
        const rawApps = db.applications || [];
        applications = rawApps.filter(a => driveIds.includes(String(a.driveId)));
      }
        
      return sendJson(res, 200, { candidates: applications || [] });
    } catch (error) {
      console.error('[ApplicationController.getAllCandidates]', error);
      return sendJson(res, 500, { error: 'Failed to fetch candidates' });
    }
  }

  static async updateApplicationStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return sendJson(res, 400, { error: 'Status is required' });
      }

      const validStatuses = ['Applied', 'Screening', 'Testing', 'Interview', 'Offered', 'Hired', 'Rejected'];
      if (!validStatuses.includes(status)) {
        return sendJson(res, 400, { error: 'Invalid status provided' });
      }

      let application = null;
      if (mongoose.connection.readyState === 1) {
        try {
          application = await Application.findById(id).populate('driveId');
        } catch {}
      }

      const db = loadDb();
      if (application) {
        if (req.user?.role !== 'admin') {
          const callerCompanyId = String(req.user?.companyId || req.user?.id);
          const driveCompanyId = String(application.driveId?.companyId || '');
          if (callerCompanyId !== driveCompanyId) {
            return sendJson(res, 403, { error: 'Forbidden: You do not own this drive' });
          }
        }
        application.status = status;
        await application.save();
      } else {
        const jsonApp = (db.applications || []).find(a => String(a._id) === String(id) || String(a.id) === String(id));
        if (!jsonApp) {
          return sendJson(res, 404, { error: 'Application not found' });
        }
        jsonApp.status = status;
        saveDb(db, 'all');
        application = jsonApp;
      }

      return sendJson(res, 200, { application });
    } catch (error) {
      console.error('[ApplicationController.updateApplicationStatus]', error);
      return sendJson(res, 500, { error: 'Failed to update application status' });
    }
  }

  static async applyToDrive(req, res) {
    try {
      const { driveId } = req.params;
      const studentId = req.user?.id || req.user?.college_id;
      if (!studentId) {
        return sendJson(res, 401, { error: 'Authentication required' });
      }

      let drive = null;
      if (mongoose.connection.readyState === 1) {
        try {
          drive = await Drive.findById(driveId);
        } catch {}
      }

      const db = loadDb();
      let jsonDrive = null;
      if (!drive && Array.isArray(db.placementDrives)) {
        jsonDrive = db.placementDrives.find(d => String(d._id) === String(driveId) || String(d.id) === String(driveId));
        if (jsonDrive) drive = jsonDrive;
      }

      if (!drive) {
        return sendJson(res, 404, { error: 'Drive not found' });
      }

      if (drive.status && drive.status !== 'Active') {
        return sendJson(res, 400, { error: 'This drive is not actively accepting applications' });
      }

      // Check for existing application
      let existingApp = null;
      if (mongoose.connection.readyState === 1) {
        try {
          existingApp = await Application.findOne({ driveId, studentId });
        } catch {}
      }
      if (!existingApp && Array.isArray(db.applications)) {
        existingApp = db.applications.find(a => (String(a.driveId) === String(driveId) || String(a.jobId) === String(driveId)) && String(a.studentId) === String(studentId));
      }

      if (existingApp) {
        return sendJson(res, 400, { error: 'You have already applied to this drive' });
      }

      const studentName = req.user?.name || req.body.studentDetails?.name || 'Student';
      const studentEmail = req.user?.email || req.body.studentDetails?.email || '';
      const studentBranch = req.user?.branch || req.body.studentDetails?.branch || 'CSE';
      const studentCgpa = Number(req.body.studentDetails?.cgpa || 0);

      const studentData = {
        id: studentId,
        name: studentName,
        email: studentEmail,
        branch: studentBranch,
        cgpa: Math.min(10, Math.max(0, studentCgpa))
      };

      // Run Eligibility Engine
      const eligibility = EligibilityEngine.evaluate(studentData, drive.eligibility);
      
      const newStatus = eligibility.isEligible ? 'Screening' : 'Rejected';
      const notes = eligibility.isEligible 
        ? 'Auto-Screened: Passed all eligibility criteria' 
        : `Auto-Rejected: ${eligibility.reason}`;

      let createdApplication = null;
      if (mongoose.connection.readyState === 1) {
        try {
          const newDoc = new Application({
            driveId,
            studentId,
            studentDetails: {
              name: studentData.name,
              email: studentData.email,
              branch: studentData.branch,
              cgpa: studentData.cgpa || 0,
              score: 0
            },
            status: newStatus,
            notes: notes
          });
          await newDoc.save();
          createdApplication = newDoc;
          await Drive.findByIdAndUpdate(driveId, { $inc: { applicantsCount: 1 } });
        } catch (mErr) {
          console.error('[ApplicationController.applyToDrive] Mongo save err:', mErr.message);
        }
      }

      if (!Array.isArray(db.applications)) db.applications = [];
      const appId = `app_${Date.now()}_${db.applications.length + 1}`;
      const jsonApp = {
        _id: appId,
        id: appId,
        driveId,
        studentId,
        studentDetails: {
          name: studentData.name,
          email: studentData.email,
          branch: studentData.branch,
          cgpa: studentData.cgpa || 0,
          score: 0
        },
        status: newStatus,
        notes: notes,
        createdAt: new Date().toISOString()
      };
      db.applications.push(jsonApp);

      if (jsonDrive) {
        jsonDrive.applicantsCount = (jsonDrive.applicantsCount || 0) + 1;
      }

      saveDb(db, 'all');

      return sendJson(res, 201, { application: createdApplication || jsonApp });
    } catch (error) {
      console.error('[ApplicationController.applyToDrive]', error);
      return sendJson(res, 500, { error: 'Failed to apply to drive' });
    }
  }
}

