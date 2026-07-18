import { ok, sendJson } from '../lib/http.js';
import { nextId } from '../lib/ids.js';

function judgeCode(code, mode) {
  const text = String(code || '').trim().toLowerCase();
  if (!text) {
    return {
      verdict: 'Wrong Answer',
      output: 'No code was submitted.'
    };
  }

  if (text.includes('syntaxerror') || text.includes('throw error')) {
    return {
      verdict: 'Runtime Error',
      output: 'The submitted code raised an error in the demo judge.'
    };
  }

  return {
    verdict: mode === 'run' ? 'Successful' : 'Accepted',
    output: mode === 'run'
      ? 'Sample test cases passed.'
      : 'All hidden and sample test cases passed.'
  };
}

function compileResult(testCases = []) {
  const cases = testCases.length ? testCases : [{ input: '', expectedOutput: '', marks: 1 }];
  const results = cases.map((testCase, index) => ({
    input: testCase.input,
    expectedOutput: testCase.expectedOutput || testCase.output,
    actualOutput: testCase.expectedOutput || testCase.output || 'ok',
    passed: true,
    marks: testCase.marks || 1,
    earnedMarks: testCase.marks || 1,
    executionTime: '0.01s',
    memoryUsed: '12MB',
    index
  }));

  const totalScore = results.reduce((sum, item) => sum + Number(item.earnedMarks || 0), 0);
  const maxScore = results.reduce((sum, item) => sum + Number(item.marks || 0), 0);

  return {
    passed: true,
    totalScore,
    maxScore,
    results
  };
}

export function registerJudgeRoutes(router) {
  router.post('/api/judge/submit', (req, res, ctx) => {
    const db = ctx.getDb();
    const submissionId = nextId('judge');
    const result = judgeCode(req.body.code, req.body.mode);
    const submission = {
      _id: submissionId,
      userId: req.body.userId || 'stu_1',
      problemId: req.body.problemId,
      problemNumber: isNaN(Number(req.body.problemId)) ? req.body.problemId : Number(req.body.problemId),
      code: req.body.code || '',
      language: req.body.language || 'python',
      verdict: result.verdict,
      output: result.output,
      createdAt: new Date().toISOString()
    };

    db.problemSubmissions.unshift(submission);
    ctx.saveDb(db);

    return ok(res, { submissionId });
  });

  router.get('/api/judge/status/:submissionId', (req, res, ctx) => {
    const submission = ctx.getDb().problemSubmissions.find(item => item._id === req.params.submissionId);
    return sendJson(res, submission ? 200 : 404, submission || { error: 'Submission not found' });
  });

  router.get('/api/judge/submissions/:userId/:problemNumber', (req, res, ctx) => {
    const param = req.params.problemNumber;
    const submissions = ctx.getDb().problemSubmissions.filter(sub =>
      String(sub.userId) === String(req.params.userId) &&
      (String(sub.problemId) === String(param) || String(sub.problemNumber) === String(param))
    );
    return sendJson(res, 200, { submissions });
  });

  router.post('/api/compile/test', (req, res) => {
    return sendJson(res, 200, compileResult(req.body.testCases || []));
  });

  router.post('/api/compile/submit/:questionId', (req, res, ctx) => {
    const db = ctx.getDb();
    const question = db.codingQuestions.find(item => item._id === req.params.questionId);
    return sendJson(res, 200, compileResult(question?.testCases || []));
  });

  router.post('/api/evaluate/theory/test', (req, res, ctx) => {
    const db = ctx.getDb();
    const answers = req.body.answers || {};
    const questionIds = req.body.questionIds || Object.keys(answers);
    const questions = questionIds
      .map(id => db.theoryQuestions.find(question => question._id === id))
      .filter(Boolean);

    const results = questions.map(question => {
      const studentAnswer = String(answers[question._id] || '');
      const lowerAnswer = studentAnswer.toLowerCase();
      const matchedKeywords = (question.keywords || []).filter(keyword => lowerAnswer.includes(keyword.toLowerCase()));
      const ratio = question.keywords?.length ? matchedKeywords.length / question.keywords.length : 0;
      const marks = Math.round(ratio * Number(question.maxMarks || 0));

      return {
        questionId: question._id,
        questionText: question.questionText,
        studentAnswer,
        marks,
        maxMarks: question.maxMarks,
        matchedKeywords,
        totalKeywords: question.keywords?.length || 0,
        confidence: ratio > 0.65 ? 'high' : ratio > 0.3 ? 'medium' : 'low',
        feedback: ratio > 0.65
          ? 'Strong answer with the key concepts covered.'
          : 'Add more key concepts and examples to improve this answer.'
      };
    });

    const totalScore = results.reduce((sum, item) => sum + item.marks, 0);
    const maxScore = results.reduce((sum, item) => sum + item.maxMarks, 0);
    const percentage = maxScore ? Math.round((totalScore / maxScore) * 100) : 0;

    return sendJson(res, 200, { totalScore, maxScore, percentage, results });
  });
}
