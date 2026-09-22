import { ok, sendJson } from '../lib/http.js';
import { nextId } from '../lib/ids.js';
import { requireAuth } from '../lib/requireAuth.js';
import { CodeExecution } from '../models/CodeExecution.js';
import { CodeExecutionService } from '../services/CodeExecutionService.js';
import { Judge0Service } from '../services/Judge0Service.js';
import { logger } from '../lib/logger.js';

export function registerJudgeRoutes(router) {

  /**
   * POST /api/judge/submit
   * ──────────────────────
   * Asynchronous submission endpoint (used by ProblemSolver).
   * 1. Validates and saves initial record to MongoDB.
   * 2. Enqueues background execution using Judge0 CE.
   * 3. Immediately returns { submissionId, jobId, status: 'queued' }.
   */
  router.post('/api/judge/submit', async (req, res, ctx) => {
    if (!requireAuth(req, res)) return;
    const db = ctx.getDb();
    const submissionId = nextId('judge');
    const userId = req.body.userId || req.user?.id || 'anonymous';
    const isAuth = !!(req.user?.id);

    // Enforce rate limiting
    try {
      await CodeExecutionService.checkRateLimit(userId, isAuth);
    } catch (err) {
      return sendJson(res, 429, { error: err.message });
    }

    // Fetch problem test cases if problemId is provided
    let testCases = [];
    if (req.body.problemId) {
      const problem =
        (db.problems || []).find(item => String(item._id) === String(req.body.problemId) || String(item.id) === String(req.body.problemId) || String(item.number) === String(req.body.problemId)) ||
        (db.codingQuestions || []).find(item => String(item._id) === String(req.body.problemId) || String(item.id) === String(req.body.problemId) || String(item.number) === String(req.body.problemId));
      if (problem?.testCases && Array.isArray(problem.testCases)) {
        testCases = problem.testCases;
      }
    }

    const code = req.body.code || '';
    const language = req.body.language || 'python';
    const mode = req.body.mode || 'submit';

    // Create a placeholder record in MongoDB for immediate persistence
    const initialRecord = {
      _id: submissionId,
      userId,
      problemId: req.body.problemId,
      problemNumber: isNaN(Number(req.body.problemId)) ? req.body.problemId : Number(req.body.problemId),
      code,
      language,
      status: 'PENDING',
      verdict: 'Pending',
      output: 'Your submission is queued and being judged by Judge0...',
      createdAt: new Date()
    };

    try {
      await CodeExecution.create(initialRecord);
    } catch (e) {
      logger.error('[Judge] Failed to write initial CodeExecution record to MongoDB:', e.message);
    }

    // Generate unique job ID for live frontend polling
    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // Enqueue asynchronous background execution
    CodeExecutionService.enqueueJob(jobId, async () => {
      let executionResult;

      try {
        if (mode === 'run' && (!testCases || testCases.length === 0)) {
          // Single execution run
          const singleRes = await CodeExecutionService.runCode({
            language,
            sourceCode: code,
            stdin: req.body.stdin || ''
          });

          executionResult = {
            verdict: singleRes.verdict,
            status: singleRes.status,
            output: singleRes.stdout || singleRes.stderr || singleRes.compileOutput || (singleRes.success ? 'Program executed successfully with no output.' : 'Execution failed.'),
            compileOutput: singleRes.compileOutput,
            executionTime: singleRes.time ? `${Math.round(singleRes.time * 1000)}ms` : undefined,
            memory: singleRes.memory ? `${singleRes.memory} KB` : undefined,
            token: singleRes.token
          };
        } else {
          // Multiple test cases execution
          const testRes = await CodeExecutionService.executeTestCases({
            language,
            sourceCode: code,
            testCases,
            isSubmit: mode === 'submit'
          });

          const allPassed = testRes.passed;
          const failedCase = testRes.results.find(r => !r.passed);

          let verdict = 'Accepted';
          let output = 'All test cases passed.';

          if (testRes.compilationError) {
            verdict = 'Compilation Error';
            output = testRes.compilationError;
          } else if (!allPassed && failedCase) {
            verdict = failedCase.error || 'Wrong Answer';
            output = failedCase.actualOutput || failedCase.error || 'Test case failed.';
          } else if (mode === 'run') {
            verdict = 'Successful';
            output = 'Sample test cases executed successfully.';
          }

          executionResult = {
            verdict,
            status: verdict.toUpperCase().replace(/\s+/g, '_'),
            output,
            totalScore: testRes.totalScore,
            maxScore: testRes.maxScore,
            compileOutput: testRes.compilationError || '',
            results: testRes.results
          };
        }
      } catch (err) {
        logger.error('[Judge] Execution failed:', err);
        executionResult = {
          verdict: 'System Error',
          status: 'SYSTEM_ERROR',
          output: err.message || 'Execution error'
        };
      }

      // Update database record with final verdict and execution metrics
      try {
        await CodeExecution.findByIdAndUpdate(submissionId, {
          verdict: executionResult.verdict,
          status: executionResult.status || 'DONE',
          output: executionResult.output,
          compileOutput: executionResult.compileOutput || '',
          executionTime: executionResult.executionTime,
          memory: executionResult.memory,
          judge0Token: executionResult.token,
          judgedAt: new Date()
        });
      } catch (e) {
        logger.error('[Judge] Failed to update CodeExecution record in MongoDB:', e.message);
      }

      return executionResult;
    });

    return ok(res, {
      submissionId,
      jobId,
      status: 'queued',
      message: 'Your code is queued. Poll /api/judge/job-status/:jobId for live result.'
    });
  });

  /**
   * GET /api/judge/job-status/:jobId
   * ─────────────────────────────────
   * Live status of an async job from in-memory tracker.
   * Returns: queued | running | done | error
   */
  router.get('/api/judge/job-status/:jobId', async (req, res) => {
    const job = await CodeExecutionService.getJob(req.params.jobId);
    if (!job) {
      return sendJson(res, 404, { error: 'Job not found or has expired.' });
    }

    const resp = {
      jobId: job.jobId,
      status: job.status,
      queuedAt: job.queuedAt,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
      waitTimeMs: job.startedAt ? job.startedAt - job.queuedAt : Date.now() - job.queuedAt,
      execTimeMs: job.finishedAt && job.startedAt ? job.finishedAt - job.startedAt : undefined
    };

    if (job.status === 'done') {
      return sendJson(res, 200, { ...resp, result: job.result });
    }
    if (job.status === 'error') {
      return sendJson(res, 200, { ...resp, error: job.error });
    }

    return sendJson(res, 200, resp);
  });

  /**
   * GET /api/judge/status/:submissionId
   * ─────────────────────────────────────
   * Fetch stored submission by submissionId from database.
   */
  router.get('/api/judge/status/:submissionId', async (req, res) => {
    try {
      const submission = await CodeExecution.findById(req.params.submissionId).lean();
      return sendJson(res, submission ? 200 : 404, submission || { error: 'Submission not found' });
    } catch (e) {
      return sendJson(res, 500, { error: 'Failed to fetch submission' });
    }
  });

  /**
   * GET /api/judge/submissions/:userId/:problemNumber
   * ──────────────────────────────────────────────────
   * Fetch submission history for a specific user and problem.
   */
  router.get('/api/judge/submissions/:userId/:problemNumber', async (req, res) => {
    const param = req.params.problemNumber;
    try {
      const submissions = await CodeExecution.find({
        userId: req.params.userId,
        $or: [
          { problemId: param },
          { problemNumber: isNaN(Number(param)) ? param : Number(param) }
        ]
      }).sort({ createdAt: -1 }).lean();
      return sendJson(res, 200, { submissions });
    } catch (e) {
      return sendJson(res, 500, { error: 'Failed to fetch submissions' });
    }
  });

  /**
   * GET /api/judge/health
   * ──────────────────────
   * Health check verifying backend and self-hosted Judge0 CE connectivity.
   */
  router.get('/api/judge/health', async (req, res) => {
    const judge0Health = await Judge0Service.checkHealth();
    const status = judge0Health.healthy ? 200 : 503;
    return sendJson(res, status, {
      service: 'mujcode-backend-judge',
      engine: 'Judge0 CE',
      healthy: judge0Health.healthy,
      judge0: judge0Health,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * POST /api/compile/test
   * ──────────────────────
   * Run code against visible test cases (used by CodingTestRunner Run button).
   */
  router.post('/api/compile/test', async (req, res) => {
    const { language, code, testCases = [], timeLimit, memoryLimit } = req.body;

    if (!code || !String(code).trim()) {
      return sendJson(res, 200, {
        passed: false,
        totalScore: 0,
        maxScore: testCases.reduce((s, tc) => s + Number(tc.marks || 1), 0),
        results: testCases.map((tc, i) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: '',
          passed: false,
          marks: tc.marks || 1,
          earnedMarks: 0,
          error: 'No code submitted',
          index: i
        }))
      });
    }

    try {
      const executionResult = await CodeExecutionService.executeTestCases({
        language: language || 'python',
        sourceCode: code,
        testCases,
        timeLimit,
        memoryLimit,
        isSubmit: false
      });

      return sendJson(res, 200, executionResult);
    } catch (err) {
      logger.error('[api/compile/test] Execution error:', err);
      return sendJson(res, 500, {
        error: err.message || 'Execution failed',
        status: 'EXECUTION_SERVICE_ERROR'
      });
    }
  });

  /**
   * POST /api/compile/submit/:questionId
   * ─────────────────────────────────────
   * Submit code against ALL test cases including hidden ones (used by CodingTestRunner Submit button).
   */
  router.post('/api/compile/submit/:questionId', async (req, res, ctx) => {
    const db = ctx.getDb();
    const question = (db.codingQuestions || []).find(item => String(item._id) === String(req.params.questionId));
    if (!question) {
      return sendJson(res, 404, { error: 'Question not found' });
    }

    const { language, code } = req.body;
    const testCases = question.testCases || [];

    if (!code || !String(code).trim()) {
      return sendJson(res, 200, {
        passed: false,
        totalScore: 0,
        maxScore: testCases.reduce((s, tc) => s + Number(tc.marks || 1), 0),
        results: testCases.map((tc, i) => ({
          input: tc.isHidden ? '[hidden]' : tc.input,
          passed: false,
          marks: tc.marks || 1,
          earnedMarks: 0,
          error: 'No code submitted',
          index: i
        }))
      });
    }

    try {
      const executionResult = await CodeExecutionService.executeTestCases({
        language: language || 'python',
        sourceCode: code,
        testCases,
        timeLimit: question.timeLimit,
        memoryLimit: question.memoryLimit,
        isSubmit: true
      });

      return sendJson(res, 200, executionResult);
    } catch (err) {
      logger.error('[api/compile/submit] Submission error:', err);
      return sendJson(res, 500, {
        error: err.message || 'Submission execution failed',
        status: 'EXECUTION_SERVICE_ERROR'
      });
    }
  });

  /**
   * POST /api/v1/code/run
   * ──────────────────────
   * Standardized application-level execution API.
   * Request:  { language: string, sourceCode: string, stdin?: string }
   * Response: { success: boolean, status: string, stdout: string, stderr: string, compileOutput: string, time: number, memory: number }
   */
  router.post('/api/v1/code/run', async (req, res) => {
    const { language, sourceCode, stdin } = req.body;

    if (!sourceCode || !String(sourceCode).trim()) {
      return sendJson(res, 400, { error: 'sourceCode is required' });
    }
    if (!language) {
      return sendJson(res, 400, { error: 'language is required' });
    }

    try {
      const result = await CodeExecutionService.runCode({
        language,
        sourceCode,
        stdin: stdin || ''
      });

      return sendJson(res, 200, result);
    } catch (err) {
      logger.error('[api/v1/code/run] Error:', err);
      return sendJson(res, 500, {
        success: false,
        status: 'EXECUTION_SERVICE_UNAVAILABLE',
        message: err.message || 'Code execution service temporarily unavailable'
      });
    }
  });

  /**
   * POST /api/evaluate/theory/test
   * ──────────────────────────────
   * Evaluates student answers against theory questions based on keyword matching.
   * (Preserved from original platform functionality)
   */
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
