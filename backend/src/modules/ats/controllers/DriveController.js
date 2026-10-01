import { Drive } from '../models/Drive.js';
import { Company } from '../models/Company.js';
import { sendJson } from '../../../lib/http.js';
import mongoose from 'mongoose';

export class DriveController {
  static async getAll(req, res) {
    try {
      if (mongoose.connection.readyState !== 1) {
        return sendJson(res, 200, { drives: [] });
      }

      const companyId = req.user?.companyId || req.user?.id;
      let filter = {};
      if (req.user?.role !== 'admin') {
        if (!companyId) return sendJson(res, 200, { drives: [] });
        filter = { companyId };
      }

      const drives = await Drive.find(filter).sort({ createdAt: -1 });
      return sendJson(res, 200, { drives });
    } catch (error) {
      console.error('[DriveController.getAll]', error);
      return sendJson(res, 500, { error: 'Failed to fetch drives' });
    }
  }

  static async create(req, res) {
    try {
      if (mongoose.connection.readyState !== 1) {
        return sendJson(res, 503, { error: 'Database unavailable' });
      }

      const companyId = req.user?.companyId || req.user?.id;
      if (!companyId && req.user?.role !== 'admin') {
        return sendJson(res, 400, { error: 'Company identity missing from user context' });
      }

      const { title, description, eligibility, salary, locationType, location, deadline } = req.body;

      if (!title) {
        return sendJson(res, 400, { error: 'Title is required' });
      }

      const newDrive = new Drive({
        companyId: companyId || req.body.companyId,
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

