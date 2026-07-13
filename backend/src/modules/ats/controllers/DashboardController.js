import { Drive } from '../models/Drive.js';
import { Company } from '../models/Company.js';
import { Application } from '../models/Application.js';
import { sendJson } from '../../../lib/http.js';

export class DashboardController {
  static async getStats(req, res) {
    try {
      const company = await Company.findOne();
      if (!company) {
        return sendJson(res, 200, {
          activeDrives: 0,
          applicants: 0,
          shortlisted: 0,
          hired: 0,
          drives: [],
          recentApplicants: []
        });
      }

      const drives = await Drive.find({ companyId: company._id }).sort({ createdAt: -1 });
      const driveIds = drives.map(d => d._id);

      // Aggregate funnel analytics
      const applications = await Application.find({ driveId: { $in: driveIds } });
      
      const funnel = {
        'Applied': 0,
        'Screening': 0,
        'Testing': 0,
        'Interview': 0,
        'Offered': 0,
        'Hired': 0,
        'Rejected': 0
      };

      applications.forEach(app => {
        if (funnel[app.status] !== undefined) {
          funnel[app.status]++;
        }
      });

      const stats = {
        activeDrives: drives.filter(d => d.status === 'Active').length,
        applicants: applications.length,
        shortlisted: funnel['Screening'] + funnel['Testing'] + funnel['Interview'] + funnel['Offered'],
        hired: funnel['Hired'],
        funnel
      };

      // Get 5 most recent applicants
      const recentApplicants = await Application.find({ driveId: { $in: driveIds } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('driveId', 'title');

      return sendJson(res, 200, {
        ...stats,
        drives,
        recentApplicants
      });
    } catch (error) {
      console.error('[DashboardController]', error);
      return sendJson(res, 500, { error: 'Server error fetching stats' });
    }
  }
}
