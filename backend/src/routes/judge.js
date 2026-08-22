import { ok, sendJson } from '../lib/http.js';
import { nextId } from '../lib/ids.js';
import { CompilerFactory } from '../../compiler/CompilerFactory.js';
import { executionQueue } from '../../compiler/ExecutionQueue.js';
import { requireAuth } from '../lib/requireAuth.js';
import { CodeExecution } from '../models/CodeExecution.js';

function normalizeOutput(str) {
  return String(str || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trim();
}

/**
 * Extract the public class name from Java source code.
 * Java requires the filename to match the public class name.
 * Falls back to 'Main' if no public class is found.
 */
function getJavaClassName(code) {
  const match = String(code || '').match(/public\s+class\s+(\w+)/);
  if (match) return match[1];
  // Fallback: grab first class name
  const fallback = String(code || '').match(/\bclass\s+(\w+)/);
  return fallback ? fallback[1] : 'Main';
}

/**
 * For Java, override the filename, compileCmd, and runCmd based on
 * the actual public class name in the submitted code.
 */
function resolveJavaConfig(lang, code, config) {
  if (lang !== 'java') {
    return { filename: undefined, compileCmd: config.compileCmd, runCmd: config.runCmd };
  }
  const className = getJavaClassName(code);
  return {
    filename: `${className}.java`,
    compileCmd: `javac ${className}.java`,
    runCmd: `java ${className}`
  };
}

export function registerJudgeRoutes(router) {

  /**
   * POST /api/judge/submit
   * ──────────────────────
   * Returns a jobId IMMEDIATELY (non-blocking).
   * The actual Docker execution is queued — client polls /api/judge/status/:submissionId
   *
   * This is what makes the system scale to 10,000+ concurrent users:
   *   - HTTP connection is freed instantly
   *   - Docker containers are limited by MAX_CONCURRENT_EXECUTIONS env var
   *   - Excess requests queue or are rejected gracefully
   */
  router.post('/api/judge/submit', async (req, res, ctx) => {
    if (!requireAuth(req, res)) return;
    const db = ctx.getDb();
    const submissionId = nextId('judge');
    const userId = req.body.userId || req.user?.id || 'anonymous';

    // Fetch test cases
    let testCases = [];
    if (req.body.problemId) {
      const problem =
        (db.problems || []).find(item => String(item._id) === String(req.body.problemId) || String(item.id) === String(req.body.problemId) || String(item.number) === String(req.body.problemId)) ||
        (db.codingQuestions || []).find(item => String(item._id) === String(req.body.problemId) || String(item.id) === String(req.body.problemId) || String(item.number) === String(req.body.problemId));
      if (problem?.testCases && Array.isArray(problem.testCases)) {
        testCases = problem.testCases;
      }
    }

    // Create a placeholder submission immediately so status polling works
    const submission = {
      _id: submissionId,
      userId,
      problemId: req.body.problemId,
      problemNumber: isNaN(Number(req.body.problemId)) ? req.body.problemId : Number(req.body.problemId),
      code: req.body.code || '',
      language: req.body.language || 'python',
      verdict: 'Pending',
      output: 'Your submission is queued and will be judged shortly...',
      createdAt: new Date()
    };

    try {
      await CodeExecution.create(submission);
    } catch (e) {
      console.error('[MongoDB] Failed to create code execution record:', e);
    }

    // ── Enqueue async execution ──────────────────────────────────────────────
    const jobId = executionQueue.enqueue(userId, async () => {
      let result;
      try {
        result = await CompilerFactory.execute(
          req.body.code || '',
          req.body.language || 'python',
          testCases,
          req.body.mode || 'submit'
        );
      } catch (e) {
        result = { verdict: 'System Error', output: e.message || String(e) };
      }

      // Update the stored submission with real verdict
      try {
        await CodeExecution.findByIdAndUpdate(submissionId, {
          verdict: result.verdict,
          output: result.output,
          judgedAt: new Date()
        });
      } catch (e) {
        console.error('[MongoDB] Failed to update code execution record:', e);
      }

      return result;
    });

    // Respond immediately with both the submission ID (for history) and jobId (for live status)
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
   * Live status of an async job (from the in-memory queue).
   * Returns: queued | running | done | error | rejected | timeout
   */
  router.get('/api/judge/job-status/:jobId', (req, res) => {
    const job = executionQueue.getJob(req.params.jobId);
    if (!job) return sendJson(res, 404, { error: 'Job not found. It may have expired (jobs are kept for 5 minutes).' });

    const resp = {
      jobId: job.jobId,
      status: job.status,
      queuedAt: job.queuedAt,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
      waitTimeMs: job.startedAt ? job.startedAt - job.queuedAt : Date.now() - job.queuedAt,
      execTimeMs: job.finishedAt && job.startedAt ? job.finishedAt - job.startedAt : undefined,
    };

    if (job.status === 'done') {
      return sendJson(res, 200, { ...resp, result: job.result });
    }
    if (job.status === 'error' || job.status === 'rejected' || job.status === 'timeout') {
      return sendJson(res, 200, { ...resp, error: job.error });
    }

    return sendJson(res, 200, resp);   // queued or running
  });

  /**
   * GET /api/judge/status/:submissionId
   * ─────────────────────────────────────
   * Fetch stored submission (after it has been judged & saved to db).
   */
  router.get('/api/judge/status/:submissionId', async (req, res, ctx) => {
    try {
      const submission = await CodeExecution.findById(req.params.submissionId).lean();
      return sendJson(res, submission ? 200 : 404, submission || { error: 'Submission not found' });
    } catch (e) {
      return sendJson(res, 500, { error: 'Failed to fetch submission' });
    }
  });

  router.get('/api/judge/submissions/:userId/:problemNumber', async (req, res, ctx) => {
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
   * Real-time queue metrics — use this for monitoring dashboards.
   */
  router.get('/api/judge/health', (req, res) => {
    const metrics = executionQueue.getMetrics();
    const healthy = metrics.circuitBreaker !== 'open';
    return sendJson(res, healthy ? 200 : 503, {
      healthy,
      ...metrics,
      timestamp: new Date().toISOString()
    });
  });

  // POST /api/compile/test  — Run code against visible test cases (Run button)
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
      const { languageConfigs } = await import('../../compiler/LanguageConfigs.js');
      const { WorkspaceManager } = await import('../../compiler/WorkspaceManager.js');
      const { DockerExecutor } = await import('../../compiler/DockerExecutor.js');
      const { VerdictEngine } = await import('../../compiler/VerdictEngine.js');

      const lang = String(language || 'python').toLowerCase();
      const config = languageConfigs[lang];
      if (!config) {
        return sendJson(res, 400, { error: `Unsupported language: ${lang}` });
      }

      const cases = testCases.length ? testCases : [{ input: '', expectedOutput: '', marks: 1 }];
      const workspace = new WorkspaceManager();
      await workspace.initWorkspace();

      // For Java: save file as {ClassName}.java to satisfy javac requirement
      const { filename, compileCmd, runCmd } = resolveJavaConfig(lang, code, config);
      await workspace.writeCode(code, config.extension, filename);

      const executor = new DockerExecutor(
        config.imageName,
        workspace.workspacePath,
        (timeLimit ? timeLimit * 1000 : config.timeLimitMs),
        memoryLimit || config.memoryLimitMB
      );

      // Compile step
      let compileErr = null;
      if (compileCmd) {
        const cr = await executor.compile(compileCmd);
        if (cr.exitCode !== 0) {
          await workspace.cleanup();
          const errMsg = cr.stderr || cr.stdout || 'Compilation failed';
          return sendJson(res, 200, {
            passed: false,
            totalScore: 0,
            maxScore: cases.reduce((s, tc) => s + Number(tc.marks || 1), 0),
            compilationError: errMsg,
            results: cases.map((tc, i) => ({
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              actualOutput: '',
              passed: false,
              marks: tc.marks || 1,
              earnedMarks: 0,
              error: `Compilation Error: ${errMsg}`,
              index: i
            }))
          });
        }
        compileErr = cr;
      }

      // Run each test case
      const results = [];
      for (let i = 0; i < cases.length; i++) {
        const tc = cases[i];
        await workspace.writeInput(tc.input || '');
        const runResult = await executor.run(runCmd);
        const expected = normalizeOutput(tc.expectedOutput || tc.output || '');
        const actual = normalizeOutput(runResult.stdout);

        let passed = false;
        let error = null;

        if (runResult.isTimeout) {
          error = 'Time Limit Exceeded';
        } else if (runResult.exitCode !== 0) {
          error = `Runtime Error: ${runResult.stderr || runResult.stdout || 'Non-zero exit code'}`;
        } else if (!expected || expected === 'ANY' || actual === expected) {
          passed = true;
        } else {
          error = `Wrong Answer`;
        }

        results.push({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: actual,
          passed,
          marks: tc.marks || 1,
          earnedMarks: passed ? (tc.marks || 1) : 0,
          executionTime: `${runResult.timeMs}ms`,
          error,
          index: i
        });
      }

      await workspace.cleanup();

      const totalScore = results.reduce((s, r) => s + r.earnedMarks, 0);
      const maxScore = results.reduce((s, r) => s + r.marks, 0);
      return sendJson(res, 200, {
        passed: results.every(r => r.passed),
        totalScore,
        maxScore,
        results
      });
    } catch (err) {
      console.error('[compile/test] Error:', err);
      return sendJson(res, 500, { error: err.message || 'Execution failed' });
    }
  });

  // POST /api/compile/submit/:questionId  — Submit code against ALL test cases (Submit button)
  router.post('/api/compile/submit/:questionId', async (req, res, ctx) => {
    const db = ctx.getDb();
    const question = (db.codingQuestions || []).find(item => item._id === req.params.questionId);
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
      const { languageConfigs } = await import('../../compiler/LanguageConfigs.js');
      const { WorkspaceManager } = await import('../../compiler/WorkspaceManager.js');
      const { DockerExecutor } = await import('../../compiler/DockerExecutor.js');

      const lang = String(language || 'python').toLowerCase();
      const config = languageConfigs[lang];
      if (!config) {
        return sendJson(res, 400, { error: `Unsupported language: ${lang}` });
      }

      const cases = testCases.length ? testCases : [];
      const workspace = new WorkspaceManager();
      await workspace.initWorkspace();

      // For Java: save file as {ClassName}.java to satisfy javac requirement
      const { filename, compileCmd, runCmd } = resolveJavaConfig(lang, code, config);
      await workspace.writeCode(code, config.extension, filename);

      const executor = new DockerExecutor(
        config.imageName,
        workspace.workspacePath,
        question.timeLimit ? question.timeLimit * 1000 : config.timeLimitMs,
        question.memoryLimit || config.memoryLimitMB
      );

      // Compile step
      if (compileCmd) {
        const cr = await executor.compile(compileCmd);
        if (cr.exitCode !== 0) {
          await workspace.cleanup();
          const errMsg = cr.stderr || cr.stdout || 'Compilation failed';
          return sendJson(res, 200, {
            passed: false,
            totalScore: 0,
            maxScore: cases.reduce((s, tc) => s + Number(tc.marks || 1), 0),
            compilationError: errMsg,
            results: cases.map((tc, i) => ({
              input: tc.isHidden ? '[hidden]' : tc.input,
              passed: false,
              marks: tc.marks || 1,
              earnedMarks: 0,
              error: `Compilation Error: ${errMsg}`,
              index: i
            }))
          });
        }
      }

      // Run ALL test cases (including hidden)
      const results = [];
      for (let i = 0; i < cases.length; i++) {
        const tc = cases[i];
        await workspace.writeInput(tc.input || '');
        const runResult = await executor.run(runCmd);
        const expected = normalizeOutput(tc.expectedOutput || tc.output || '');
        const actual = normalizeOutput(runResult.stdout);

        let passed = false;
        let error = null;

        if (runResult.isTimeout) {
          error = 'Time Limit Exceeded';
        } else if (runResult.exitCode !== 0) {
          error = `Runtime Error: ${runResult.stderr || runResult.stdout || 'Non-zero exit'}`;
        } else if (!expected || expected === 'ANY' || actual === expected) {
          passed = true;
        } else {
          error = 'Wrong Answer';
        }

        results.push({
          // Hide input/expected output for hidden test cases
          input: tc.isHidden ? '[hidden]' : tc.input,
          expectedOutput: tc.isHidden ? '[hidden]' : tc.expectedOutput,
          actualOutput: tc.isHidden ? (passed ? '[correct]' : '[wrong]') : actual,
          passed,
          marks: tc.marks || 1,
          earnedMarks: passed ? (tc.marks || 1) : 0,
          executionTime: `${runResult.timeMs}ms`,
          error,
          index: i
        });
      }

      await workspace.cleanup();

      const totalScore = results.reduce((s, r) => s + r.earnedMarks, 0);
      const maxScore = results.reduce((s, r) => s + r.marks, 0);
      return sendJson(res, 200, {
        passed: results.every(r => r.passed),
        totalScore,
        maxScore,
        results
      });
    } catch (err) {
      console.error('[compile/submit] Error:', err);
      return sendJson(res, 500, { error: err.message || 'Execution failed' });
    }
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


