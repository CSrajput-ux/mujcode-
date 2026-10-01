import { Application } from '../models/Application.js';
import { Drive } from '../models/Drive.js';
import { Company } from '../models/Company.js';
import { EligibilityEngine } from '../services/EligibilityEngine.js';
import { sendJson } from '../../../lib/http.js';
import mongoose from 'mongoose';

export class ApplicationController {
  static async getDriveApplications(req, res) {
    try {
      if (mongoose.connection.readyState !== 1) {
        return sendJson(res, 200, { applications: [] });
      }

      const { driveId } = req.params;
      if (!driveId) {
        return sendJson(res, 400, { error: 'Drive ID is required' });
      }

      const applications = await Application.find({ driveId }).sort({ createdAt: -1 });
      return sendJson(res, 200, { applications });
    } catch (error) {
      console.error('[ApplicationController.getDriveApplications]', error);
      return sendJson(res, 500, { error: 'Failed to fetch applications' });
    }
  }

  static async getAllCandidates(req, res) {
    try {
      if (mongoose.connection.readyState !== 1) {
        return sendJson(res, 200, { candidates: [] });
      }

      let companyDrives = [];
      const companyId = req.user?.companyId || req.user?.id;
      if (req.user?.role === 'admin') {
        companyDrives = await Drive.find({}, '_id title');
      } else if (companyId) {
        companyDrives = await Drive.find({ companyId }, '_id title');
      } else {
        return sendJson(res, 200, { candidates: [] });
      }

      const driveIds = companyDrives.map(d => d._id);
      if (driveIds.length === 0) {
        return sendJson(res, 200, { candidates: [] });
      }
      
      const applications = await Application.find({ driveId: { $in: driveIds } })
        .populate('driveId', 'title role')
        .sort({ createdAt: -1 });
        
      return sendJson(res, 200, { candidates: applications });
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

      const application = await Application.findById(id).populate('driveId');
      if (!application) {
        return sendJson(res, 404, { error: 'Application not found' });
      }

      // Enforce multi-tenant company ownership check
      if (req.user?.role !== 'admin') {
        const callerCompanyId = String(req.user?.companyId || req.user?.id);
        const driveCompanyId = String(application.driveId?.companyId || '');
        if (callerCompanyId !== driveCompanyId) {
          return sendJson(res, 403, { error: 'Forbidden: You do not own this drive' });
        }
      }

      application.status = status;
      await application.save();

      return sendJson(res, 200, { application });
    } catch (error) {
      console.error('[ApplicationController.updateApplicationStatus]', error);
      return sendJson(res, 500, { error: 'Failed to update application status' });
    }
  }

  static async applyToDrive(req, res) {
    try {
      const { driveId } = req.params;
      // Derive identity from verified user token
      const studentId = req.user?.id || req.user?.college_id;
      if (!studentId) {
        return sendJson(res, 401, { error: 'Authentication required' });
      }

      const drive = await Drive.findById(driveId);
      if (!drive) {
        return sendJson(res, 404, { error: 'Drive not found' });
      }

      if (drive.status !== 'Active') {
        return sendJson(res, 400, { error: 'This drive is not actively accepting applications' });
      }

      // Check for existing application
      const existingApp = await Application.findOne({ driveId, studentId });
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

      const newApplication = new Application({
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

      await newApplication.save();

      // Update Drive applicant count atomically
      await Drive.findByIdAndUpdate(driveId, { $inc: { applicantsCount: 1 } });

      return sendJson(res, 201, { application: newApplication });
    } catch (error) {
      console.error('[ApplicationController.applyToDrive]', error);
      return sendJson(res, 500, { error: 'Failed to apply to drive' });
    }
  }
}

