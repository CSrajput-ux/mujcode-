import { Drive } from '../models/Drive.js';
import { Company } from '../models/Company.js';
import { sendJson } from '../../../lib/http.js';

export class DriveController {
  static async getAll(req, res) {
    try {
      // In production, derive companyId from req.user
      const company = await Company.findOne();
      if (!company) {
        return sendJson(res, 200, { drives: [] });
      }

      const drives = await Drive.find({ companyId: company._id }).sort({ createdAt: -1 });
      return sendJson(res, 200, { drives });
    } catch (error) {
      console.error('[DriveController.getAll]', error);
      return sendJson(res, 500, { error: 'Failed to fetch drives' });
    }
  }

  static async create(req, res) {
    try {
      const company = await Company.findOne();
      if (!company) {
        return sendJson(res, 404, { error: 'Company not found' });
      }

      const { title, description, eligibility, salary, locationType, location, deadline } = req.body;

      if (!title) {
        return sendJson(res, 400, { error: 'Title is required' });
      }

      const newDrive = new Drive({
        companyId: company._id,
        title,
        description,
        eligibility,
        salary,
        locationType,
        location,
        deadline,
        status: 'Active'
      });

      await newDrive.save();
      return sendJson(res, 201, { drive: newDrive });
    } catch (error) {
      console.error('[DriveController.create]', error);
      return sendJson(res, 500, { error: 'Failed to create drive' });
    }
  }
}
