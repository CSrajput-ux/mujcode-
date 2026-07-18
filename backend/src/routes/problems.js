import { sendJson } from '../lib/http.js';

function solvedNumbers(db, userId) {
  return new Set(
    db.problemSubmissions
      .filter(sub => String(sub.userId) === String(userId) && sub.verdict === 'Accepted')
      .flatMap(sub => [String(sub.problemId), String(sub.problemNumber)].filter(Boolean))
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
    const param = req.params.number;
    const db = ctx.getDb();
    let problem = db.problems.find(item => item._id === param);
    if (!problem) {
      problem = db.problems.find(item => Number(item.number) === Number(param));
    }
    return sendJson(res, problem ? 200 : 404, problem ? { problem } : { error: 'Problem not found' });
  });

  router.get('/api/problems', (req, res, ctx) => {
    const db = ctx.getDb();
    const solved = req.query.userId ? solvedNumbers(db, req.query.userId) : new Set();
    let problems = db.problems.map(problem => ({
      ...problem,
      status: (solved.has(String(problem._id)) || solved.has(String(problem.number))) ? 'solved' : 'unsolved'
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

