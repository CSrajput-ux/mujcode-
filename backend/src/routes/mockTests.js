import { ok, sendJson } from '../lib/http.js';
import { nextId } from '../lib/ids.js';

export function registerMockTestRoutes(router) {
  router.get('/api/mock-tests', (req, res, ctx) => {
    const mockTests = ctx.getDb().mockTests.map(({ questions, ...test }) => test);
    return sendJson(res, 200, { mockTests });
  });

  router.post('/api/mock-tests/:mockTestId/start', (req, res, ctx) => {
    const db = ctx.getDb();
    const test = db.mockTests.find(item => item._id === req.params.mockTestId);
    if (!test) return sendJson(res, 404, { error: 'Mock test not found' });

    const attemptId = nextId('mock_attempt');
    db.mockAttempts.push({
      _id: attemptId,
      mockTestId: test._id,
      studentId: req.body.studentId || req.user?.id || 'stu_1',
      startedAt: new Date().toISOString(),
      status: 'InProgress'
    });
    ctx.saveDb(db);

    const questions = test.questions.slice(0, test.questionsPerAttempt).map(({ correctOption, explanation, ...question }) => question);
    return sendJson(res, 200, {
      attemptId,
      questions,
      duration: test.duration
    });
  });

  router.post('/api/mock-tests/:attemptId/submit', (req, res, ctx) => {
    const db = ctx.getDb();
    const attempt = db.mockAttempts.find(item => item._id === req.params.attemptId || item._id === req.body.attemptId);
    if (!attempt) return sendJson(res, 404, { error: 'Attempt not found' });

    const test = db.mockTests.find(item => item._id === attempt.mockTestId);
    const answers = req.body.answers || [];
    const results = test.questions.map(question => {
      const answer = answers.find(item => item.questionId === question._id);
      const selectedOption = answer ? Number(answer.selectedOption) : null;
      const isCorrect = selectedOption === Number(question.correctOption);
      return {
        questionId: question._id,
        questionText: question.questionText,
        options: question.options,
        selectedOption,
        correctOption: question.correctOption,
        isCorrect,
        explanation: question.explanation,
        points: question.points,
        earnedPoints: isCorrect ? question.points : 0
      };
    });

    const score = results.reduce((sum, item) => sum + item.earnedPoints, 0);
    const maxScore = results.reduce((sum, item) => sum + item.points, 0);
    const percentage = maxScore ? (score / maxScore) * 100 : 0;

    Object.assign(attempt, {
      status: 'Submitted',
      submittedAt: new Date().toISOString(),
      score,
      maxScore,
      percentage,
      timeTaken: req.body.timeTaken || 0
    });
    ctx.saveDb(db);

    return sendJson(res, 200, {
      score,
      maxScore,
      percentage,
      passed: percentage >= 50,
      timeTaken: req.body.timeTaken || 0,
      results
    });
  });
}
