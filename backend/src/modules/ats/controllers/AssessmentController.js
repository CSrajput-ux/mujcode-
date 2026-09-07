import { Assessment } from '../models/Assessment.js';
import { Company } from '../models/Company.js';
import { sendJson } from '../../../lib/http.js';
import mongoose from 'mongoose';

export class AssessmentController {
  static async create(req, res) {
    try {
      const company = await Company.findOne();
      const companyId = (req.user?.companyId && mongoose.Types.ObjectId.isValid(req.user.companyId))
        ? req.user.companyId
        : (company ? company._id.toString() : 'comp-1');
      
      const { title, description, driveId, durationMinutes, questions } = req.body;
      
      const assessment = new Assessment({
        title,
        description,
        driveId,
        companyId,
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
      const company = await Company.findOne();
      const companyId = (req.user?.companyId && mongoose.Types.ObjectId.isValid(req.user.companyId))
        ? req.user.companyId
        : (company ? company._id.toString() : 'comp-1');
      const assessments = await Assessment.find({ companyId });
      return sendJson(res, 200, assessments);
    } catch (error) {
      console.error('[AssessmentController.getAll]', error);
      return sendJson(res, 500, { error: 'Failed to fetch assessments' });
    }
  }
}
