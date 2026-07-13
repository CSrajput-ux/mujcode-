import { sendJson } from '../lib/http.js';

function solvedNumbers(db, userId) {
  return new Set(
    db.problemSubmissions
      .filter(sub => String(sub.userId) === String(userId) && sub.verdict === 'Accepted')
      .map(sub => Number(sub.problemNumber))
  );
}

export function registerProblemsRoutes(router) {
  router.get('/api/problems/metadata', (req, res, ctx) => {
    const db = ctx.getDb();
    return sendJson(res, 200, {
      categories: [...new Set(db.problems.map(problem => problem.category))],
      topics: [...new Set(db.problems.map(problem => problem.topic))]
    });
  });

  router.get('/api/problems/stats', (req, res, ctx) => {
    const total = ctx.getDb().problems.reduce((acc, problem) => {
      const key = problem.difficulty?.toLowerCase();
      if (key) acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, { easy: 0, medium: 0, hard: 0 });

    return sendJson(res, 200, { total });
  });

  router.get('/api/problems/number/:number', (req, res, ctx) => {
    const problem = ctx.getDb().problems.find(item => Number(item.number) === Number(req.params.number));
    return sendJson(res, problem ? 200 : 404, problem ? { problem } : { error: 'Problem not found' });
  });

  router.get('/api/problems', (req, res, ctx) => {
    const db = ctx.getDb();
    const solved = req.query.userId ? solvedNumbers(db, req.query.userId) : new Set();
    let problems = db.problems.map(problem => ({
      ...problem,
      status: solved.has(Number(problem.number)) ? 'solved' : 'unsolved'
    }));

    if (req.query.category) {
      problems = problems.filter(problem => problem.category === req.query.category);
    }

    if (req.query.difficulty) {
      problems = problems.filter(problem => problem.difficulty === req.query.difficulty);
    }

    if (req.query.topic) {
      problems = problems.filter(problem => problem.topic === req.query.topic);
    }

    return sendJson(res, 200, { problems });
  });
}
