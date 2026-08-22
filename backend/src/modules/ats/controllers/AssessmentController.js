import { Assessment } from '../models/Assessment.js';
import { sendJson } from '../../../lib/http.js';

export class AssessmentController {
  static async create(req, res) {
    try {
      // Mock companyId since auth isn't fully integrated into ATS yet for this prototype
      const companyId = req.user?.companyId || 'comp-1'; 
      
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
      const companyId = req.user?.companyId || 'comp-1';
      const assessments = await Assessment.find({ companyId }).populate('driveId', 'title role');
      return sendJson(res, 200, assessments);
    } catch (error) {
      console.error('[AssessmentController.getAll]', error);
      return sendJson(res, 500, { error: 'Failed to fetch assessments' });
    }
  }
}
