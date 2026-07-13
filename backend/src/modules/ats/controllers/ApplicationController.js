import { Application } from '../models/Application.js';
import { Drive } from '../models/Drive.js';
import { EligibilityEngine } from '../services/EligibilityEngine.js';
import { sendJson } from '../../../lib/http.js';

export class ApplicationController {
  static async getDriveApplications(req, res) {
    try {
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

      const application = await Application.findByIdAndUpdate(
        id, 
        { status },
        { new: true }
      );

      if (!application) {
        return sendJson(res, 404, { error: 'Application not found' });
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
      const studentData = req.body.studentDetails; // Passed from frontend auth context

      if (!studentData || !studentData.id) {
        return sendJson(res, 400, { error: 'Student details required' });
      }

      const drive = await Drive.findById(driveId);
      if (!drive) {
        return sendJson(res, 404, { error: 'Drive not found' });
      }

      if (drive.status !== 'Active') {
        return sendJson(res, 400, { error: 'This drive is not actively accepting applications' });
      }

      // Check for existing application
      const existingApp = await Application.findOne({ driveId, studentId: studentData.id });
      if (existingApp) {
        return sendJson(res, 400, { error: 'You have already applied to this drive' });
      }

      // Run Eligibility Engine
      const eligibility = EligibilityEngine.evaluate(studentData, drive.eligibility);
      
      const newStatus = eligibility.isEligible ? 'Screening' : 'Rejected';
      const notes = eligibility.isEligible 
        ? 'Auto-Screened: Passed all eligibility criteria' 
        : `Auto-Rejected: ${eligibility.reason}`;

      const newApplication = new Application({
        driveId,
        studentId: studentData.id,
        studentDetails: {
          name: studentData.name,
          email: studentData.email,
          branch: studentData.branch,
          cgpa: studentData.cgpa || 0,
          score: studentData.score || 0
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
