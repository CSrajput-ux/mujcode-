import { ok, sendJson } from '../lib/http.js';

export function registerUniversityRoutes(router) {
  router.get('/api/university/faculties', (req, res, ctx) => {
    const db = ctx.getDb();
    const faculties = [...new Set(db.departments.map(dept => dept.faculty))].map((name, index) => ({
      id: index + 1,
      name
    }));
    return sendJson(res, 200, faculties);
  });

  router.get('/api/university/departments', (req, res, ctx) => {
    const db = ctx.getDb();
    const departments = req.query.faculty
      ? db.departments.filter(dept => dept.faculty === req.query.faculty)
      : db.departments;
    return sendJson(res, 200, departments);
  });

  router.get('/api/university/programs', (req, res, ctx) => {
    const db = ctx.getDb();
    const deptId = Number(req.query.deptId);
    return sendJson(res, 200, db.programs.filter(program => Number(program.deptId) === deptId));
  });

  router.get('/api/university/branches', (req, res, ctx) => {
    const db = ctx.getDb();
    const progId = Number(req.query.progId);
    return sendJson(res, 200, db.branches.filter(branch => Number(branch.progId) === progId));
  });

  router.get('/api/university/sections', (req, res, ctx) => {
    const db = ctx.getDb();
    const branchId = Number(req.query.branchId);
    return sendJson(res, 200, db.sections.filter(section => Number(section.branchId) === branchId));
  });

  router.get('/api/university/subjects', (req, res, ctx) => {
    const db = ctx.getDb();
    const branchId = Number(req.query.branchId);
    const semester = Number(req.query.semester);
    return sendJson(res, 200, db.subjects.filter(subject =>
      Number(subject.branchId) === branchId &&
      (!semester || Number(subject.semester) === semester)
    ));
  });

  router.get('/api/university/academic-years', (req, res, ctx) => {
    return sendJson(res, 200, ctx.getDb().academicYears);
  });
}
