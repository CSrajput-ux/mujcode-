import { Drive } from '../models/Drive.js';
import { Company } from '../models/Company.js';
import { sendJson } from '../../../lib/http.js';
import { loadDb, saveDb } from '../../../lib/storage.js';
import mongoose from 'mongoose';

export class DriveController {
  static async getAll(req, res) {
    try {
      let drives = [];
      const companyId = req.user?.companyId || req.user?.id;
      const isAdminOrFaculty = req.user?.role === 'admin' || req.user?.role === 'faculty';

      if (mongoose.connection.readyState === 1) {
        try {
          let filter = {};
          if (!isAdminOrFaculty && companyId) {
            filter = { companyId };
          }
          drives = await Drive.find(filter).sort({ createdAt: -1 });
        } catch (mErr) {
          console.error('[DriveController.getAll] Mongo error, reading from JSON fallback:', mErr.message);
        }
      }

      // If Mongo is offline or empty, read from unified memory placementDrives
      if (!drives || drives.length === 0) {
        const db = loadDb();
        const rawList = db.placementDrives || [];
        drives = rawList
          .filter(d => isAdminOrFaculty || !companyId || String(d.companyId) === String(companyId))
          .map(d => ({
            ...d,
            _id: d._id || `drive_${d.id}`,
            salary: d.salary || { ctc: d.ctc || '' },
            eligibility: d.eligibility || { minCgpa: d.minCgpa || 0, maxBacklogs: d.maxBacklogs || 0 }
          }));
      }

      return sendJson(res, 200, { drives: drives || [] });
    } catch (error) {
      console.error('[DriveController.getAll]', error);
      return sendJson(res, 500, { error: 'Failed to fetch drives' });
    }
  }

  static async create(req, res) {
    try {
      const companyId = req.user?.companyId || req.user?.id || 'admin_company';
      const { title, description, eligibility, salary, locationType, location, deadline } = req.body;

      if (!title || !String(title).trim()) {
        return sendJson(res, 400, { error: 'Title is required' });
      }

      const db = loadDb();
      if (!Array.isArray(db.placementDrives)) db.placementDrives = [];

      const comp = (db.companies || []).find(c => String(c.id) === String(companyId) || c._id === companyId);
      const companyName = comp ? comp.name : (req.user?.name || 'Corporate Partner');

      let createdDrive = null;

      // 1. Try persisting to MongoDB if connected
      if (mongoose.connection.readyState === 1) {
        try {
          const newDoc = new Drive({
            companyId,
            title: String(title).trim(),
            description: description || '',
            eligibility: eligibility || { minCgpa: 0, maxBacklogs: 0 },
            salary: salary || { ctc: '' },
            locationType: locationType || 'On-Site',
            location: location || '',
            deadline: deadline ? new Date(deadline) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: 'Active'
          });
          await newDoc.save();
          createdDrive = newDoc.toObject ? newDoc.toObject() : newDoc;
        } catch (mErr) {
          console.error('[DriveController.create] Mongo save error, falling back to db.json:', mErr.message);
        }
      }

      // 2. Persist to unified DB engine (ensures offline reliability, instant multi-worker sync & admin views)
      if (!createdDrive) {
        const numericId = (db.placementDrives.reduce((max, d) => Math.max(max, Number(d.id) || 0), 0)) + 1;
        createdDrive = {
          id: numericId,
          _id: `drive_${Date.now()}_${numericId}`,
          companyId,
          companyName,
          title: String(title).trim(),
          description: description || '',
          eligibility: eligibility || { minCgpa: 0, maxBacklogs: 0 },
          salary: salary || { ctc: '' },
          locationType: locationType || 'On-Site',
          location: location || '',
          deadline: deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'Active',
          applicantsCount: 0,
          shortlistedCount: 0,
          hiredCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      } else {
        createdDrive.companyName = companyName;
      }

      // Add to placementDrives list if not already present
      const alreadyPresent = db.placementDrives.some(d => String(d._id) === String(createdDrive._id));
      if (!alreadyPresent) {
        db.placementDrives.unshift(createdDrive);
      }

      // Add to activity logs strictly of type company
      if (!Array.isArray(db.activityLogs)) db.activityLogs = [];
      db.activityLogs.unshift({
        type: 'company',
        message: 'Placement drive scheduled',
        detail: `${createdDrive.title} (${companyName})`,
        createdAt: new Date().toISOString()
      });

      // Synchronize in-memory cache, PostgreSQL, and cluster workers
      saveDb(db, 'all');

      return sendJson(res, 201, { drive: createdDrive, success: true, message: 'Drive created successfully' });
    } catch (error) {
      console.error('[DriveController.create]', error);
      return sendJson(res, 500, { error: error.message || 'Failed to create drive' });
    }
  }
}
