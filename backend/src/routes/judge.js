import { ok, sendJson } from '../lib/http.js';
import { nextId } from '../lib/ids.js';
import { requireAuth, requireSelfOrFacultyOrAdmin } from '../lib/requireAuth.js';
import { codeRateLimiter } from '../middlewares/rateLimiter.js';
import { CodeExecution } from '../models/CodeExecution.js';
import { CodeExecutionService } from '../services/CodeExecutionService.js';
import { Judge0Service } from '../services/Judge0Service.js';
import { logger } from '../lib/logger.js';

const MAX_CODE_BYTES = 64 * 1024; // 64 KB

export function registerJudgeRoutes(router) {

  /**
   * POST /api/judge/submit
   * ──────────────────────
   * Asynchronous submission endpoint (used by ProblemSolver).
   */
  const handleSubmission = async (req, res, ctx) => {
    if (!requireAuth(req, res)) return;
    if (await codeRateLimiter(req, res)) return;

    const db = ctx.getDb();
    const submissionId = nextId('judge');
    const userId = req.user.id || req.user.college_id;

    const code = req.body.code || '';
    if (code.length > MAX_CODE_BYTES) {
      return sendJson(res, 400, { error: 'Source code exceeds maximum allowed size (64KB)' });
    }

    // Fetch problem test cases and schema/seed if problemId is provided
    let testCases = [];
    let schemaSql = req.body.schemaSql || '';
    let seedSql = req.body.seedSql || '';
    if (req.body.problemId) {
      const problem =
        (db.problems || []).find(item => String(item._id) === String(req.body.problemId) || String(item.id) === String(req.body.problemId) || String(item.number) === String(req.body.problemId)) ||
        (db.codingQuestions || []).find(item => String(item._id) === String(req.body.problemId) || String(item.id) === String(req.body.problemId) || String(item.number) === String(req.body.problemId));
      if (problem?.testCases && Array.isArray(problem.testCases)) {
        testCases = problem.testCases;
      }
      if (problem?.schemaSql) schemaSql = problem.schemaSql;
      if (problem?.seedSql) seedSql = problem.seedSql;
    }
    const language = req.body.language || 'python';
    try {
      CodeExecutionService.resolveLanguageId(language);
    } catch (langErr) {
      return sendJson(res, 400, {
        error: 'Unsupported language',
        message: langErr.message,
        supportedLanguages: ['c', 'cpp', 'java', 'python', 'javascript', 'go', 'sql']
      });
    }
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
      output: 'Your submission is queued and being processed...',
      createdAt: new Date()
    };

    try {
      await CodeExecution.create(initialRecord);
    } catch (e) {
      logger.error('[Judge] Failed to write initial CodeExecution record to MongoDB:', e.message);
    }

    // Generate unique job ID for live frontend polling
    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // Enqueue asynchronous background execution with user ownership
    CodeExecutionService.enqueueJob(jobId, userId, async () => {
      let executionResult;

      try {
        if (mode === 'run' && (!testCases || testCases.length === 0)) {
          // Single execution run
          const singleRes = await CodeExecutionService.runCode({
            language,
            sourceCode: code,
            stdin: req.body.stdin || '',
            schemaSql,
            seedSql
          });

          executionResult = {
            verdict: singleRes.verdict,
            status: singleRes.status,
            output: singleRes.stdout || singleRes.stderr || singleRes.compileOutput || (singleRes.success ? 'Program executed successfully with no output.' : 'Execution failed.'),
            compileOutput: singleRes.compileOutput,
            executionTime: singleRes.time ? `${Math.round(singleRes.time * 1000)}ms` : undefined,
            memory: singleRes.memory ? `${singleRes.memory} KB` : undefined,
            token: singleRes.token,
            columns: singleRes.columns,
            rows: singleRes.rows
          };
        } else {
          // Multiple test cases execution
          const testRes = await CodeExecutionService.executeTestCases({
            language,
            sourceCode: code,
            testCases,
            schemaSql,
            seedSql,
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
      message: 'Your code is queued. Poll /api/compiler/job-status/:jobId or /api/judge/job-status/:jobId for live result.'
    });
  };

  /**
   * POST /api/judge/submit & POST /api/compiler/submit & POST /api/compiler/submissions
   */
  router.post('/api/judge/submit', handleSubmission);
  router.post('/api/compiler/submit', handleSubmission);
  router.post('/api/compiler/submissions', handleSubmission);

  /**
   * GET /api/judge/job-status/:jobId & GET /api/compiler/job-status/:jobId
   * Protected: Caller must own the job or have faculty/admin privileges
   */
  const handleJobStatus = async (req, res) => {
    if (!requireAuth(req, res)) return;

    const job = await CodeExecutionService.getJob(req.params.jobId);
    if (!job) {
      return sendJson(res, 404, { error: 'Job not found or has expired.' });
    }

    if (job.userId && !requireSelfOrFacultyOrAdmin(req, res, job.userId)) {
      return;
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
  };

  router.get('/api/judge/job-status/:jobId', handleJobStatus);
  router.get('/api/compiler/job-status/:jobId', handleJobStatus);

  /**
   * GET /api/judge/status/:submissionId & GET /api/compiler/submissions/:submissionId
   * Protected: Caller must own the submission or have faculty/admin privileges
   */
  const handleSubmissionStatus = async (req, res) => {
    if (!requireAuth(req, res)) return;

    try {
      const submission = await CodeExecution.findById(req.params.submissionId).lean();
      if (!submission) {
        return sendJson(res, 404, { error: 'Submission not found' });
      }

      if (submission.userId && !requireSelfOrFacultyOrAdmin(req, res, submission.userId)) {
        return;
      }

      const sanitized = {
        _id: submission._id,
        userId: submission.userId,
        problemId: submission.problemId,
        problemNumber: submission.problemNumber,
        language: submission.language,
        status: submission.status,
        verdict: submission.verdict,
        output: submission.output,
        compileOutput: submission.compileOutput,
        executionTime: submission.executionTime,
        memory: submission.memory,
        createdAt: submission.createdAt,
        judgedAt: submission.judgedAt
      };

      return sendJson(res, 200, sanitized);
    } catch (e) {
      return sendJson(res, 500, { error: 'Failed to fetch submission' });
    }
  };

  router.get('/api/judge/status/:submissionId', handleSubmissionStatus);
  router.get('/api/compiler/submissions/:submissionId', handleSubmissionStatus);

  /**
   * GET /api/judge/submissions/:userId/:problemNumber
   * ──────────────────────────────────────────────────
   * Fetch submission history for a specific user and problem (Protected: self, faculty, admin).
   */
  router.get('/api/judge/submissions/:userId/:problemNumber', async (req, res, ctx) => {
    if (!requireSelfOrFacultyOrAdmin(req, res, req.params.userId)) return;
    const param = req.params.problemNumber;
    try {
      let submissions = [];
      try {
        submissions = await CodeExecution.find({
          userId: req.params.userId,
          $or: [
            { problemId: param },
            { problemNumber: isNaN(Number(param)) ? param : Number(param) }
          ]
        }).sort({ createdAt: -1 }).lean();
      } catch (mongoErr) {
        submissions = [];
      }

      if (!submissions || submissions.length === 0) {
        const db = ctx?.getDb ? ctx.getDb() : null;
        if (db && db.problemSubmissions) {
          const userParam = String(req.params.userId);
          const student = (db.students || []).find(s => s.id === userParam || s.college_id === userParam);
          const userIds = new Set([userParam, student?.id, student?.college_id].filter(Boolean));

          submissions = db.problemSubmissions.filter(sub => {
            const matchesUser = userIds.has(String(sub.userId));
            const matchesProb = String(sub.problemId) === String(param) || String(sub.problemNumber) === String(param);
            return matchesUser && matchesProb;
          }).sort((a, b) => new Date(b.createdAt || b.judgedAt || 0).getTime() - new Date(a.createdAt || a.judgedAt || 0).getTime());
        }
      }

      return sendJson(res, 200, { submissions: submissions || [] });
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
    if (!requireAuth(req, res)) return;
    if (await codeRateLimiter(req, res)) return;

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

    if (String(code).length > MAX_CODE_BYTES) {
      return sendJson(res, 400, { error: 'Source code exceeds maximum allowed size (64KB)' });
    }

    try {
      const executionResult = await CodeExecutionService.executeTestCases({
        language: language || 'python',
        sourceCode: code,
        testCases,
        timeLimit: Math.min(5, Number(timeLimit) || 2),
        memoryLimit: Math.min(262144, Number(memoryLimit) || 128000),
        isSubmit: false
      });

      return sendJson(res, 200, executionResult);
    } catch (err) {
      logger.error('[api/compile/test] Execution error:', err);
      return sendJson(res, 500, {
        error: 'Execution failed',
        status: 'EXECUTION_SERVICE_ERROR'
      });
    }
  });

  /**
   * POST /api/compile/submit/:questionId
   * ─────────────────────────────────────
   * Submit code against ALL test cases including hidden ones.
   */
  router.post('/api/compile/submit/:questionId', async (req, res, ctx) => {
    if (!requireAuth(req, res)) return;
    if (await codeRateLimiter(req, res)) return;

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

    if (String(code).length > MAX_CODE_BYTES) {
      return sendJson(res, 400, { error: 'Source code exceeds maximum allowed size (64KB)' });
    }

    try {
      const executionResult = await CodeExecutionService.executeTestCases({
        language: language || 'python',
        sourceCode: code,
        testCases,
        timeLimit: Math.min(5, Number(question.timeLimit) || 2),
        memoryLimit: Math.min(262144, Number(question.memoryLimit) || 128000),
        isSubmit: true
      });

      return sendJson(res, 200, executionResult);
    } catch (err) {
      logger.error('[api/compile/submit] Submission error:', err);
      return sendJson(res, 500, {
        error: 'Submission execution failed',
        status: 'EXECUTION_SERVICE_ERROR'
      });
    }
  });

  /**
   * POST /api/v1/code/run
   * ──────────────────────
   * Standardized application-level execution API.
   */
  router.post('/api/v1/code/run', async (req, res) => {
    if (!requireAuth(req, res)) return;
    if (await codeRateLimiter(req, res)) return;

    const { language, sourceCode, stdin } = req.body;

    if (!sourceCode || !String(sourceCode).trim()) {
      return sendJson(res, 400, { error: 'sourceCode is required' });
    }
    if (!language) {
      return sendJson(res, 400, { error: 'language is required' });
    }
    if (String(sourceCode).length > MAX_CODE_BYTES) {
      return sendJson(res, 400, { error: 'Source code exceeds maximum allowed size (64KB)' });
    }

    try {
      const result = await CodeExecutionService.runCode({
        language,
        sourceCode,
        stdin: String(stdin || '').slice(0, 16384)
      });

      return sendJson(res, 200, result);
    } catch (err) {
      logger.error('[api/v1/code/run] Error:', err);
      return sendJson(res, 500, {
        success: false,
        status: 'EXECUTION_SERVICE_UNAVAILABLE',
        message: 'Code execution service temporarily unavailable'
      });
    }
  });

  /**
   * POST /api/evaluate/theory/test
   * ──────────────────────────────
   * Evaluates student answers against theory questions based on keyword matching.
   */
  router.post('/api/evaluate/theory/test', (req, res, ctx) => {
    if (!requireAuth(req, res)) return;
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

  /**
   * POST /api/compiler/sql/execute
   * ──────────────────────────────
   * Direct isolated in-memory SQL execution endpoint.
   */
  router.post('/api/compiler/sql/execute', async (req, res) => {
    if (!requireAuth(req, res)) return;
    if (await codeRateLimiter(req, res)) return;

    const { query, schemaSql = '', seedSql = '', rowLimit = 100, timeLimit = 2 } = req.body;

    if (!query || !String(query).trim()) {
      return sendJson(res, 400, { error: 'SQL query cannot be empty' });
    }
    if (String(query).length > MAX_CODE_BYTES) {
      return sendJson(res, 400, { error: 'SQL query exceeds maximum allowed size (64KB)' });
    }

    try {
      const result = await CodeExecutionService.executeSql({
        query,
        schemaSql,
        seedSql,
        rowLimit,
        timeLimit
      });

      return sendJson(res, 200, result);
    } catch (err) {
      logger.error('[api/compiler/sql/execute] Error:', err);
      return sendJson(res, 500, {
        success: false,
        error: err.message || 'SQL execution failed',
        status: 'EXECUTION_ERROR'
      });
    }
  });

  /**
   * GET /api/judge/languages & GET /api/compiler/languages
   * ───────────────────────────────────────────────────────
   * Returns supported languages across Judge0 and SQL providers.
   */
  const handleLanguages = async (req, res) => {
    try {
      const languages = await CodeExecutionService.getSupportedLanguages();
      return sendJson(res, 200, { success: true, languages });
    } catch (err) {
      logger.warn(`[Compiler] /languages error: ${err.message}`);
      return sendJson(res, 503, { error: 'Execution engine unavailable', detail: err.message });
    }
  };

  router.get('/api/judge/languages', handleLanguages);
  router.get('/api/compiler/languages', handleLanguages);

  /**
   * GET /api/judge/health & GET /api/compiler/health
   * ────────────────────────────────────────────────
   * Check connection status of Judge0 CE and isolated SQL engine.
   */
  const handleHealth = async (req, res) => {
    const health = await CodeExecutionService.checkHealth();
    return sendJson(res, health.healthy ? 200 : 503, {
      service: 'mujcode-compiler-service',
      healthy: health.healthy,
      providers: health.providers,
      timestamp: new Date().toISOString()
    });
  };

  router.get('/api/judge/health', handleHealth);
  router.get('/api/compiler/health', handleHealth);
}

