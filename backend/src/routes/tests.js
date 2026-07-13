import { badRequest, ok, sendJson } from '../lib/http.js';
import { nextId } from '../lib/ids.js';
import { getQuestionsForTest, studentSafeTest } from './helpers.js';

function testWithQuestions(db, test) {
  const questions = getQuestionsForTest(db, test._id);
  const genericQuestions = questions.mcq.map(question => ({
    _id: question._id,
    text: question.text || question.questionText,
    type: 'MCQ',
    options: question.options,
    marks: question.marks,
    explanation: question.explanation
  }));

  return {
    ...test,
    questions: genericQuestions,
    codingQuestions: questions.coding,
    theoryQuestions: questions.theory
  };
}

function facultyTestStats(db, test) {
  const submissions = db.testSubmissions.filter(sub => sub.testId === test._id);
  const avgScore = submissions.length
    ? submissions.reduce((sum, sub) => sum + Number(sub.score || 0), 0) / submissions.length
    : 0;

  return {
    _id: test._id,
    title: test.title,
    type: test.type,
    startTime: test.startTime,
    duration: test.duration,
    totalAppeared: submissions.length,
    avgScore,
    status: test.status,
    isPublished: Boolean(test.isPublished)
  };
}

function addQuestion(db, testId, type, body) {
  const id = nextId(type);
  const base = { _id: id, testId, ...body };

  if (type === 'mcq') {
    const item = {
      multipleCorrect: false,
      marks: 1,
      order: db.mcqQuestions.filter(q => q.testId === testId).length + 1,
      ...base,
      text: body.text || body.questionText,
      questionText: body.questionText || body.text
    };
    db.mcqQuestions.push(item);
    return item;
  }

  if (type === 'coding') {
    const item = {
      allowedLanguages: ['python'],
      starterCode: [],
      testCases: [],
      totalMarks: 10,
      timeLimit: 2,
      memoryLimit: 128,
      ...base
    };
    db.codingQuestions.push(item);
    return item;
  }

  const item = {
    keywords: [],
    maxMarks: body.maxMarks || 10,
    ...base
  };
  db.theoryQuestions.push(item);
  return item;
}

function updateQuestion(collection, id, body) {
  const item = collection.find(question => question._id === id);
  if (!item) return null;
  Object.assign(item, body);
  if (body.questionText || body.text) {
    item.questionText = body.questionText || body.text;
    item.text = body.text || body.questionText;
  }
  return item;
}

export function registerTestsRoutes(router) {
  router.get('/api/tests/faculty/all', (req, res, ctx) => {
    const db = ctx.getDb();
    return sendJson(res, 200, db.tests.map(test => facultyTestStats(db, test)));
  });

  router.post('/api/tests/create', (req, res, ctx) => {
    const db = ctx.getDb();
    const id = nextId('test');
    const test = {
      _id: id,
      title: req.body.title,
      description: req.body.description || '',
      type: req.body.type || 'Quiz',
      testType: req.body.testType || 'MCQ',
      status: 'Draft',
      startTime: req.body.startTime || new Date().toISOString(),
      endTime: req.body.endTime || '',
      duration: Number(req.body.duration || 60),
      proctored: Boolean(req.body.proctored),
      totalMarks: Number(req.body.totalMarks || 100),
      branch: req.body.branch || 'CSE',
      section: req.body.section || 'A',
      semester: Number(req.body.semester || 4),
      isPublished: false
    };

    db.tests.unshift(test);
    ctx.saveDb(db);

    return ok(res, {
      test,
      redirectUrl: `/faculty/tests/${id}/builder`
    }, 201);
  });

  router.get('/api/tests/:testId/submissions', (req, res, ctx) => {
    const submissions = ctx.getDb().testSubmissions.filter(sub => sub.testId === req.params.testId);
    return sendJson(res, 200, submissions);
  });

  router.patch('/api/tests/:testId/publish', (req, res, ctx) => {
    const db = ctx.getDb();
    const test = db.tests.find(item => item._id === req.params.testId);
    if (!test) return sendJson(res, 404, { error: 'Test not found' });
    test.isPublished = !test.isPublished;
    test.status = test.isPublished && test.status === 'Draft' ? 'Upcoming' : test.status;
    ctx.saveDb(db);
    return ok(res, { test });
  });

  router.delete('/api/tests/:testId', (req, res, ctx) => {
    const db = ctx.getDb();
    db.tests = db.tests.filter(test => test._id !== req.params.testId);
    db.mcqQuestions = db.mcqQuestions.filter(question => question.testId !== req.params.testId);
    db.codingQuestions = db.codingQuestions.filter(question => question.testId !== req.params.testId);
    db.theoryQuestions = db.theoryQuestions.filter(question => question.testId !== req.params.testId);
    db.testSubmissions = db.testSubmissions.filter(submission => submission.testId !== req.params.testId);
    ctx.saveDb(db);
    return ok(res, { message: 'Test deleted' });
  });

  router.get('/api/tests/:testId/questions/mcq/student', (req, res, ctx) => {
    const questions = ctx.getDb().mcqQuestions
      .filter(question => question.testId === req.params.testId)
      .map(({ correctAnswers, explanation, ...safe }) => safe);
    return sendJson(res, 200, questions);
  });

  router.get('/api/tests/:testId/questions/coding/student', (req, res, ctx) => {
    const questions = ctx.getDb().codingQuestions
      .filter(question => question.testId === req.params.testId)
      .map(question => ({
        ...question,
        testCases: question.testCases.map(testCase => testCase.isHidden
          ? { ...testCase, expectedOutput: undefined }
          : testCase)
      }));
    return sendJson(res, 200, questions);
  });

  router.get('/api/tests/:testId/questions/theory/student', (req, res, ctx) => {
    const questions = ctx.getDb().theoryQuestions
      .filter(question => question.testId === req.params.testId)
      .map(({ modelAnswer, keywords, ...safe }) => safe);
    return sendJson(res, 200, questions);
  });

  router.get('/api/tests/:testId/questions/mcq', (req, res, ctx) => {
    return sendJson(res, 200, ctx.getDb().mcqQuestions.filter(question => question.testId === req.params.testId));
  });

  router.post('/api/tests/:testId/questions/mcq', (req, res, ctx) => {
    const db = ctx.getDb();
    const question = addQuestion(db, req.params.testId, 'mcq', req.body);
    ctx.saveDb(db);
    return sendJson(res, 201, question);
  });

  router.get('/api/tests/:testId/questions/coding', (req, res, ctx) => {
    return sendJson(res, 200, ctx.getDb().codingQuestions.filter(question => question.testId === req.params.testId));
  });

  router.post('/api/tests/:testId/questions/coding', (req, res, ctx) => {
    const db = ctx.getDb();
    const question = addQuestion(db, req.params.testId, 'coding', req.body);
    ctx.saveDb(db);
    return sendJson(res, 201, question);
  });

  router.get('/api/tests/:testId/questions/theory', (req, res, ctx) => {
    return sendJson(res, 200, ctx.getDb().theoryQuestions.filter(question => question.testId === req.params.testId));
  });

  router.post('/api/tests/:testId/questions/theory', (req, res, ctx) => {
    const db = ctx.getDb();
    const question = addQuestion(db, req.params.testId, 'theory', req.body);
    ctx.saveDb(db);
    return sendJson(res, 201, question);
  });

  router.put('/api/questions/mcq/:questionId', (req, res, ctx) => {
    const db = ctx.getDb();
    const question = updateQuestion(db.mcqQuestions, req.params.questionId, req.body);
    if (!question) return sendJson(res, 404, { error: 'Question not found' });
    ctx.saveDb(db);
    return sendJson(res, 200, question);
  });

  router.delete('/api/questions/mcq/:questionId', (req, res, ctx) => {
    const db = ctx.getDb();
    db.mcqQuestions = db.mcqQuestions.filter(question => question._id !== req.params.questionId);
    ctx.saveDb(db);
    return ok(res, { message: 'Question deleted' });
  });

  router.put('/api/questions/coding/:questionId', (req, res, ctx) => {
    const db = ctx.getDb();
    const question = updateQuestion(db.codingQuestions, req.params.questionId, req.body);
    if (!question) return sendJson(res, 404, { error: 'Question not found' });
    ctx.saveDb(db);
    return sendJson(res, 200, question);
  });

  router.delete('/api/questions/coding/:questionId', (req, res, ctx) => {
    const db = ctx.getDb();
    db.codingQuestions = db.codingQuestions.filter(question => question._id !== req.params.questionId);
    ctx.saveDb(db);
    return ok(res, { message: 'Question deleted' });
  });

  router.put('/api/questions/theory/:questionId', (req, res, ctx) => {
    const db = ctx.getDb();
    const question = updateQuestion(db.theoryQuestions, req.params.questionId, req.body);
    if (!question) return sendJson(res, 404, { error: 'Question not found' });
    ctx.saveDb(db);
    return sendJson(res, 200, question);
  });

  router.delete('/api/questions/theory/:questionId', (req, res, ctx) => {
    const db = ctx.getDb();
    db.theoryQuestions = db.theoryQuestions.filter(question => question._id !== req.params.questionId);
    ctx.saveDb(db);
    return ok(res, { message: 'Question deleted' });
  });

  router.post('/api/tests/submit', (req, res, ctx) => {
    const db = ctx.getDb();
    const test = db.tests.find(item => item._id === req.body.testId);
    if (!test) return sendJson(res, 404, { error: 'Test not found' });

    const questions = db.mcqQuestions.filter(question => question.testId === test._id);
    const answers = req.body.answers || [];
    const score = answers.reduce((sum, answer) => {
      const question = questions.find(item => item._id === answer.questionId);
      return question?.correctAnswers?.includes(Number(answer.selectedOption))
        ? sum + Number(question.marks || 0)
        : sum;
    }, 0);
    const totalMaxScore = questions.reduce((sum, question) => sum + Number(question.marks || 0), 0);
    const student = db.students.find(item => item.id === req.body.studentId || item.college_id === req.body.studentId);
    const submission = {
      _id: nextId('test_sub'),
      testId: test._id,
      studentId: req.body.studentId,
      studentName: student?.fullName || 'Student',
      rollNumber: student?.rollNumber || '',
      section: student?.section || '',
      score,
      totalMaxScore,
      status: score >= totalMaxScore * 0.4 ? 'Pass' : 'Fail',
      submitTime: new Date().toISOString(),
      warningsIssued: Number(req.body.warningsIssued || 0)
    };

    db.testSubmissions.unshift(submission);
    ctx.saveDb(db);
    return sendJson(res, 201, submission);
  });

  router.get('/api/tests/submissions/:studentId', (req, res, ctx) => {
    return sendJson(res, 200, ctx.getDb().testSubmissions.filter(sub => sub.studentId === req.params.studentId));
  });

  router.get('/api/tests/:testId', (req, res, ctx) => {
    const db = ctx.getDb();
    const test = db.tests.find(item => item._id === req.params.testId);
    return sendJson(res, test ? 200 : 404, test ? testWithQuestions(db, test) : { error: 'Test not found' });
  });

  router.get('/api/tests', (req, res, ctx) => {
    const db = ctx.getDb();
    let tests = db.tests.filter(test => test.isPublished !== false);

    if (req.query.type) tests = tests.filter(test => test.type === req.query.type || test.testType === req.query.type);
    if (req.query.status) tests = tests.filter(test => test.status === req.query.status);
    if (req.query.branch) tests = tests.filter(test => !test.branch || test.branch === req.query.branch);
    if (req.query.section) tests = tests.filter(test => !test.section || test.section === req.query.section);
    if (req.query.semester) tests = tests.filter(test => !test.semester || Number(test.semester) === Number(req.query.semester));

    return sendJson(res, 200, tests.map(test => studentSafeTest(db, test)));
  });
}
