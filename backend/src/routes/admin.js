import bcrypt from 'bcrypt';
import { z } from 'zod';
import { ok, sendJson } from '../lib/http.js';
import { nextId } from '../lib/ids.js';
import { includesText, paginate } from '../lib/pagination.js';
import { dashboardStats, enrichDrive, studentForAdmin, systemHealth } from './helpers.js';
import { requireAdmin } from '../lib/requireAuth.js';
import { validateSchema } from '../lib/validation.js';
import { ActivityLog } from '../models/ActivityLog.js';

// --- Zod Validation Schemas ---
const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  industry: z.string().min(1, 'Industry is required'),
  location: z.string().optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  logoUrl: z.string().url('Invalid logo URL').optional().or(z.literal('')),
  isActive: z.boolean().optional()
});

const placementDriveSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  companyId: z.coerce.number().min(1, 'Company ID is required'),
  academicYearId: z.coerce.number().min(1, 'Academic Year ID is required'),
  driveDate: z.string().min(1, 'Drive date is required'),
  description: z.string().optional(),
  status: z.string().optional()
});

const studentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().optional(),
  rollNumber: z.string().min(1, 'Roll number is required'),
  branchId: z.coerce.number().optional(),
  sectionId: z.coerce.number().optional(),
  branch: z.string().optional(),
  section: z.string().optional(),
  year: z.string().optional(),
  semester: z.coerce.number().optional()
});

const facultySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().optional(),
  facultyId: z.string().min(1, 'Faculty ID is required'),
  department: z.string().optional(),
  designation: z.string().optional()
});


function filteredStudents(db, query) {
  return db.students
    .map(studentForAdmin)
    .filter(student =>
      includesText(`${student.fullName} ${student.User?.name} ${student.User?.email} ${student.rollNumber}`, query.search) &&
      (!query.branch || student.branch === query.branch) &&
      (!query.section || student.section === query.section) &&
      (!query.year || String(student.year) === String(query.year))
    );
}

function filteredFaculty(db, query) {
  return db.faculty.filter(faculty =>
    includesText(`${faculty.name} ${faculty.email} ${faculty.facultyId}`, query.search) &&
    (!query.department || faculty.department === query.department)
  );
}

function filteredCompanies(db, query) {
  return db.companies.filter(company =>
    includesText(`${company.name} ${company.industry}`, query.search) &&
    (!query.industry || company.industry === query.industry)
  );
}

function filteredPlacements(db, query) {
  return db.placementDrives.filter(drive =>
    (!query.status || drive.status === query.status) &&
    (!query.companyId || Number(drive.companyId) === Number(query.companyId))
  );
}

export function registerAdminRoutes(router) {
  router.get('/api/admin/dashboard/stats', (req, res, ctx) => {
    if (!requireAdmin(req, res)) return;
    return ok(res, { data: dashboardStats(ctx.getDb()) });
  });

  router.get('/api/admin/dashboard/students', (req, res, ctx) => {
    if (!requireAdmin(req, res)) return;
    const data = filteredStudents(ctx.getDb(), req.query);
    const page = paginate(data, req.query);
    return ok(res, { data: { students: page.items, pagination: page.pagination } });
  });

  router.get('/api/admin/dashboard/faculty', (req, res, ctx) => {
    if (!requireAdmin(req, res)) return;
    const data = filteredFaculty(ctx.getDb(), req.query);
    const page = paginate(data, req.query);
    return ok(res, { data: { faculty: page.items, pagination: page.pagination } });
  });

  router.get('/api/admin/dashboard/companies', (req, res, ctx) => {
    if (!requireAdmin(req, res)) return;
    const data = filteredCompanies(ctx.getDb(), req.query);
    const page = paginate(data, req.query);
    return ok(res, { data: { companies: page.items, pagination: page.pagination } });
  });

  router.post('/api/admin/dashboard/companies', (req, res, ctx) => {
    if (!requireAdmin(req, res)) return;
    if (!validateSchema(req, res, companySchema)) return;
    const db = ctx.getDb();
    const id = (db.companies.at(-1)?.id || 0) + 1;
    const company = {
      id,
      _id: `company_${id}`,
      name: req.body.name || 'New Company',
      industry: req.body.industry || 'Technology',
      location: req.body.location || '',
      contactEmail: req.body.contactEmail || '',
      website: req.body.website || '',
      logoUrl: req.body.logoUrl || '',
      isActive: req.body.isActive ?? true
    };
    db.companies.push(company);
    ctx.saveDb(db);
    return sendJson(res, 201, company);
  });

  router.put('/api/admin/dashboard/companies/:id', (req, res, ctx) => {
    if (!requireAdmin(req, res)) return;
    const db = ctx.getDb();
    const company = db.companies.find(item => String(item.id) === req.params.id || item._id === req.params.id);
    if (!company) return sendJson(res, 404, { error: 'Company not found' });
    // Fix mass assignment (CRIT-7) by explicitly selecting fields
    const updates = {
      name: req.body.name,
      industry: req.body.industry,
      location: req.body.location,
      contactEmail: req.body.contactEmail,
      website: req.body.website,
      logoUrl: req.body.logoUrl,
      isActive: req.body.isActive
    };
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);
    Object.assign(company, updates);
    ctx.saveDb(db);
    return ok(res, { data: company });
  });

  router.get('/api/admin/dashboard/placements', (req, res, ctx) => {
    if (!requireAdmin(req, res)) return;
    const db = ctx.getDb();
    const data = filteredPlacements(db, req.query).map(drive => enrichDrive(db, drive));
    const page = paginate(data, req.query);
    return ok(res, { data: { placements: page.items, pagination: page.pagination } });
  });

  router.post('/api/admin/dashboard/placements', (req, res, ctx) => {
    if (!requireAdmin(req, res)) return;
    if (!validateSchema(req, res, placementDriveSchema)) return;
    const db = ctx.getDb();
    const id = (db.placementDrives.at(-1)?.id || 0) + 1;
    const drive = {
      id,
      _id: `drive_${id}`,
      title: req.body.title || 'New Drive',
      companyId: Number(req.body.companyId || 1),
      academicYearId: Number(req.body.academicYearId || 1),
      driveDate: req.body.driveDate || new Date().toISOString().slice(0, 10),
      description: req.body.description || '',
      status: req.body.status || 'Scheduled'
    };
    db.placementDrives.push(drive);
    ctx.saveDb(db);
    return sendJson(res, 201, enrichDrive(db, drive));
  });

  router.put('/api/admin/dashboard/placements/:id', (req, res, ctx) => {
    if (!requireAdmin(req, res)) return;
    const db = ctx.getDb();
    const drive = db.placementDrives.find(item => String(item.id) === req.params.id || item._id === req.params.id);
    if (!drive) return sendJson(res, 404, { error: 'Placement drive not found' });
    // Fix mass assignment (CRIT-7)
    const updates = {
      title: req.body.title,
      companyId: req.body.companyId ? Number(req.body.companyId) : undefined,
      academicYearId: req.body.academicYearId ? Number(req.body.academicYearId) : undefined,
      driveDate: req.body.driveDate,
      description: req.body.description,
      status: req.body.status
    };
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);
    Object.assign(drive, updates);
    ctx.saveDb(db);
    return ok(res, { data: enrichDrive(db, drive) });
  });

  router.get('/api/admin/students/pending-count', (req, res) => {
    if (!requireAdmin(req, res)) return;
    sendJson(res, 200, { count: 0 });
  });
  router.get('/api/admin/questions/pending-count', (req, res) => {
    if (!requireAdmin(req, res)) return;
    sendJson(res, 200, { count: 2 });
  });
  router.get('/api/admin/placement/drives/live-count', (req, res, ctx) => {
    if (!requireAdmin(req, res)) return;
    const count = ctx.getDb().placementDrives.filter(drive => drive.status === 'Ongoing').length;
    return sendJson(res, 200, { count });
  });
  router.get('/api/admin/proctoring/violations-count', (req, res) => {
    if (!requireAdmin(req, res)) return;
    sendJson(res, 200, { count: 1 });
  });

  router.post('/api/admin/students/bulk-upload', async (req, res, ctx) => {
    if (!requireAdmin(req, res)) return;
    const db = ctx.getDb();
    const file = req.body.files?.find(f => f.fieldname === 'file');
    if (!file) return sendJson(res, 400, { error: 'No file uploaded' });

    let facultyIds = [];
    try {
      if (req.body.facultyIds) {
        facultyIds = JSON.parse(req.body.facultyIds);
      }
    } catch (e) { }

    const text = file.buffer.toString('utf8');
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length <= 1) return ok(res, { message: 'No data to import', imported: 0 });

    const headers = lines[0].split(',').map(h => h.trim());

    let imported = 0;
    const newStudents = [];
    const newUsers = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });

      if (!row.Email || !row.RollNumber) continue;

      if (db.users.find(u => u.email.toLowerCase() === row.Email.toLowerCase())) continue;

      const id = nextId('stu');

      const user = {
        id,
        name: row.Name || 'Student',
        email: row.Email.toLowerCase(),
        password: row.RollNumber,
        role: 'student',
        isPasswordChanged: false,
        isActive: true,
        college_id: row.RollNumber,
        branch: row.Branch || 'CSE',
        section: row.Section || 'A',
        year: row.Year || '1',
        semester: Number(row.Semester || 1)
      };

      const student = {
        id,
        _id: id,
        fullName: user.name,
        college_id: user.college_id,
        rollNumber: user.college_id,
        branch: user.branch,
        section: user.section,
        year: String(user.year),
        semester: user.semester,
        facultyMentors: facultyIds,
        // Legacy single subjects list (backward compatible)
        subjects: row.Subjects ? row.Subjects.split(';').map(s => s.trim()).filter(Boolean) : [],
        // New: separate theory and lab subjects
        theorySubjects: row.TheorySubjects ? row.TheorySubjects.split(';').map(s => s.trim()).filter(Boolean) : [],
        labSubjects: row.LabSubjects ? row.LabSubjects.split(';').map(s => s.trim()).filter(Boolean) : [],
        User: {
          name: user.name,
          email: user.email,
          isActive: true
        }
      };

      newUsers.push(user);
      newStudents.push(student);
      imported++;
    }

    // Hash all passwords concurrently
    await Promise.all(newUsers.map(async (u) => {
      u.password = await bcrypt.hash(u.password, 10);
    }));

    if (imported > 0) {
      db.users.push(...newUsers);
      db.students.push(...newStudents);
      ctx.saveDb(db);
    }

    return ok(res, { message: `Successfully imported ${imported} students`, imported });
  });

  router.get('/api/admin/students', (req, res, ctx) => {
    if (!requireAdmin(req, res)) return;
    const data = filteredStudents(ctx.getDb(), req.query);
    if (!req.query.page && req.query.section) {
      return sendJson(res, 200, data.map(student => ({
        _id: student._id,
        fullName: student.fullName || student.User?.name,
        college_id: student.college_id,
        section: student.section,
        branch: student.branch
      })));
    }

    const page = paginate(data, req.query);
    return ok(res, { data: { students: page.items, pagination: page.pagination } });
  });

  router.get('/api/admin/students/:id', (req, res, ctx) => {
    if (!requireAdmin(req, res)) return;
    const student = ctx.getDb().students.find(item => item.id === req.params.id || item._id === req.params.id);
    return sendJson(res, student ? 200 : 404, student ? { data: studentForAdmin(student) } : { error: 'Student not found' });
  });

  router.post('/api/admin/students', async (req, res, ctx) => {
    if (!requireAdmin(req, res)) return;
    if (!validateSchema(req, res, studentSchema)) return;
    const db = ctx.getDb();
    const id = nextId('stu');
    const branch = db.branches.find(item => Number(item.id) === Number(req.body.branchId));
    const section = db.sections.find(item => Number(item.id) === Number(req.body.sectionId));
    const user = {
      id,
      name: req.body.name,
      email: req.body.email,
      password: await bcrypt.hash(req.body.password || 'password123', 10),
      role: 'student',
      isPasswordChanged: false,
      isActive: true,
      college_id: req.body.rollNumber,
      branch: branch?.name || req.body.branch || 'CSE',
      section: section?.name || req.body.section || 'A',
      year: req.body.year || '1',
      semester: Number(req.body.semester || 1)
    };
    const student = {
      id,
      _id: id,
      fullName: req.body.name,
      college_id: req.body.rollNumber,
      rollNumber: req.body.rollNumber,
      branch: user.branch,
      section: user.section,
      year: String(user.year),
      semester: user.semester,
      User: {
        name: user.name,
        email: user.email,
        isActive: true
      }
    };
    db.users.push(user);
    db.students.push(student);
    ctx.saveDb(db);
    return sendJson(res, 201, { success: true, data: studentForAdmin(student) });
  });

  router.put('/api/admin/students/:id', (req, res, ctx) => {
    if (!requireAdmin(req, res)) return;
    const db = ctx.getDb();
    const student = db.students.find(item => item.id === req.params.id || item._id === req.params.id);
    if (!student) return sendJson(res, 404, { error: 'Student not found' });
    // Fix mass assignment (CRIT-7)
    const updates = {
      fullName: req.body.name || req.body.fullName,
      college_id: req.body.rollNumber || req.body.college_id,
      rollNumber: req.body.rollNumber,
      branch: req.body.branch,
      section: req.body.section,
      year: req.body.year ? String(req.body.year) : undefined,
      semester: req.body.semester ? Number(req.body.semester) : undefined,
      facultyMentors: req.body.facultyMentors,
      theorySubjects: req.body.theorySubjects,
      labSubjects: req.body.labSubjects
    };
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);
    Object.assign(student, updates);
    if (req.body.name || req.body.email) {
      student.User = {
        ...(student.User || {}),
        name: req.body.name || student.User?.name,
        email: req.body.email || student.User?.email
      };
    }
    ctx.saveDb(db);
    return ok(res, { data: studentForAdmin(student) });
  });

  router.delete('/api/admin/students/:id', (req, res, ctx) => {
    if (!requireAdmin(req, res)) return;
    const db = ctx.getDb();
    db.students = db.students.filter(student => student.id !== req.params.id && student._id !== req.params.id);
    db.users = db.users.filter(user => !(user.id === req.params.id && user.role === 'student'));
    ctx.saveDb(db);
    return ok(res, { message: 'Student deleted' });
  });

  router.post('/api/admin/students/bulk-delete', (req, res, ctx) => {
    if (!requireAdmin(req, res)) return;
    const db = ctx.getDb();
    const ids = req.body.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      return sendJson(res, 400, { error: 'No student IDs provided' });
    }

    db.students = db.students.filter(student => !ids.includes(student.id) && !ids.includes(student._id));
    db.users = db.users.filter(user => !ids.includes(user.id));

    ctx.saveDb(db);
    return ok(res, { message: `${ids.length} students deleted successfully` });
  });

  router.get('/api/admin/faculty', (req, res, ctx) => {
    if (!requireAdmin(req, res)) return;
    const data = filteredFaculty(ctx.getDb(), req.query);
    const page = paginate(data, req.query);
    return ok(res, { data: { faculty: page.items, pagination: page.pagination } });
  });

  router.get('/api/admin/faculty/:id', (req, res, ctx) => {
    if (!requireAdmin(req, res)) return;
    const faculty = ctx.getDb().faculty.find(item => item._id === req.params.id || item.id === req.params.id);
    return sendJson(res, faculty ? 200 : 404, faculty ? { data: faculty } : { error: 'Faculty not found' });
  });

  router.post('/api/admin/faculty', async (req, res, ctx) => {
    if (!requireAdmin(req, res)) return;
    if (!validateSchema(req, res, facultySchema)) return;
    const db = ctx.getDb();
    const id = nextId('fac');
    const faculty = {
      _id: id,
      id,
      name: req.body.name,
      email: req.body.email,
      facultyId: req.body.facultyId,
      department: req.body.department || 'CSE',
      designation: req.body.designation || 'Assistant Professor',
      teachingCourses: [],
      teachingAssignments: []
    };
    db.faculty.push(faculty);
    db.users.push({
      id,
      name: faculty.name,
      email: faculty.email,
      password: await bcrypt.hash(req.body.password || 'password123', 10),
      role: 'faculty',
      isPasswordChanged: false,
      isActive: true,
      facultyId: faculty.facultyId,
      department: faculty.department,
      designation: faculty.designation
    });
    ctx.saveDb(db);
    return sendJson(res, 201, { success: true, data: faculty });
  });

  router.post('/api/admin/faculty/assign-courses', (req, res, ctx) => {
    if (!requireAdmin(req, res)) return;
    const db = ctx.getDb();
    const faculty = db.faculty.find(item => item._id === req.body.facultyId || item.id === req.body.facultyId);
    if (!faculty) return sendJson(res, 404, { error: 'Faculty not found' });
    faculty.teachingCourses = req.body.courseIds || [];
    ctx.saveDb(db);
    return ok(res, { data: faculty });
  });

  router.put('/api/admin/faculty/:id', (req, res, ctx) => {
    if (!requireAdmin(req, res)) return;
    const db = ctx.getDb();
    const faculty = db.faculty.find(item => item._id === req.params.id || item.id === req.params.id);
    if (!faculty) return sendJson(res, 404, { error: 'Faculty not found' });
    // Fix mass assignment (CRIT-7)
    const updates = {
      name: req.body.name,
      email: req.body.email,
      facultyId: req.body.facultyId,
      department: req.body.department,
      designation: req.body.designation
    };
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);
    Object.assign(faculty, updates);
    ctx.saveDb(db);
    return ok(res, { data: faculty });
  });

  router.delete('/api/admin/faculty/:id', (req, res, ctx) => {
    if (!requireAdmin(req, res)) return;
    const db = ctx.getDb();
    db.faculty = db.faculty.filter(faculty => faculty._id !== req.params.id && faculty.id !== req.params.id);
    ctx.saveDb(db);
    return ok(res, { message: 'Faculty deleted' });
  });

  router.get('/api/admin/companies', (req, res, ctx) => {
    if (!requireAdmin(req, res)) return;
    return sendJson(res, 200, ctx.getDb().companies);
  });

  router.get('/api/admin/system/activity-logs', async (req, res, ctx) => {
    if (!requireAdmin(req, res)) return;
    const limit = Number(req.query.limit || 10);
    const query = req.query.type ? { type: req.query.type } : {};
    try {
      const logs = await ActivityLog.find(query).sort({ timestamp: -1 }).limit(limit).lean();
      return ok(res, { data: logs });
    } catch (e) {
      return sendJson(res, 500, { error: 'Failed to fetch activity logs' });
    }
  });

  router.get('/api/admin/system/health', (req, res, ctx) => {
    if (!requireAdmin(req, res)) return;
    return sendJson(res, 200, systemHealth(ctx, ctx.getDb()).systemHealth);
  });

  router.get('/api/admin/system/uptime', (req, res, ctx) => {
    if (!requireAdmin(req, res)) return;
    return sendJson(res, 200, systemHealth(ctx, ctx.getDb()).uptime);
  });

  router.get('/api/admin/system/stats', (req, res, ctx) => {
    if (!requireAdmin(req, res)) return;
    return sendJson(res, 200, systemHealth(ctx, ctx.getDb()).platformStats);
  });

  router.get('/api/admin/system/dashboard-data', (req, res, ctx) => {
    if (!requireAdmin(req, res)) return;
    return ok(res, { data: systemHealth(ctx, ctx.getDb()) });
  });
}
