import { Assessment } from '../models/Assessment.js';
import { Company } from '../models/Company.js';
import { sendJson } from '../../../lib/http.js';
import mongoose from 'mongoose';

export class AssessmentController {
  static async create(req, res) {
    try {
      if (mongoose.connection.readyState !== 1) {
        return sendJson(res, 503, { error: 'Database unavailable' });
      }

      const companyId = req.user?.companyId || req.user?.id;
      if (!companyId && req.user?.role !== 'admin') {
        return sendJson(res, 400, { error: 'Company identity missing from user context' });
      }
      
      const { title, description, driveId, durationMinutes, questions } = req.body;
      
      const assessment = new Assessment({
        title,
        description,
        driveId,
        companyId: companyId || req.body.companyId,
        durationMinutes,
        questions,
        status: 'Active'
      });
      
      await assessment.save();
      
      return sendJson(res, 201, { message: 'Assessment created successfully', assessment });
    } catch (error) {
      console.error('[AssessmentController.create]', error);
      return sendJson(res, 500, { error: 'Failed to create assessment' });
    }
  }

  static async getAll(req, res) {
    try {
      if (mongoose.connection.readyState !== 1) {
        return sendJson(res, 200, []);
      }

      const companyId = req.user?.companyId || req.user?.id;
      let filter = {};
      if (req.user?.role !== 'admin') {
        if (!companyId) return sendJson(res, 200, []);
        filter = { companyId };
      }
      const assessments = await Assessment.find(filter);
      return sendJson(res, 200, assessments);

    } catch (error) {
      console.error('[AssessmentController.getAll]', error);
      return sendJson(res, 500, { error: 'Failed to fetch assessments' });
    }
  }
}
