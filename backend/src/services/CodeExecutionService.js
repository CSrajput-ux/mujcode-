import { Judge0Service } from './Judge0Service.js';
import { logger } from '../lib/logger.js';
import { judge0SubmissionsTotal } from '../lib/metrics.js';
import { redis } from '../config/redis.js';

/**
 * Verified Judge0 CE Default Language IDs
 * Checked against official Judge0 CE languages index
 */
const DEFAULT_LANGUAGE_MAP = {
  python: 71,       // Python (3.8.1)
  python3: 71,
  py: 71,
  javascript: 63,   // JavaScript (Node.js 12.14.0)
  js: 63,
  node: 63,
  nodejs: 63,
  typescript: 74,   // TypeScript (3.7.4)
  ts: 74,
  java: 62,         // Java (OpenJDK 13.0.1)
  c: 50,            // C (GCC 9.2.0)
  cpp: 54,          // C++ (GCC 9.2.0)
  'c++': 54,
  cplusplus: 54,
  go: 60,           // Go (1.13.5)
  golang: 60,
  rust: 73,         // Rust (1.40.0)
  rs: 73,
  csharp: 51,       // C# (Mono 6.6.0.161)
  'c#': 51,
  cs: 51,
  php: 68           // PHP (7.4.1)
};

// ── Rate Limiter and Job Storage ───────────────────────────────────────────────
// Uses Redis to support massive concurrency across multiple backend nodes.

function normalizeOutput(str) {
  return String(str || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trim();
}

export class CodeExecutionService {
  /**
   * Resolve a language string (e.g., 'python', 'java', 'cpp') to a Judge0 Language ID
   */
  static resolveLanguageId(langStr) {
    if (!langStr) return DEFAULT_LANGUAGE_MAP.python;
    const clean = String(langStr).toLowerCase().trim();

    if (!isNaN(Number(clean)) && Number(clean) > 0) {
      return Number(clean);
    }

    const id = DEFAULT_LANGUAGE_MAP[clean];
    if (!id) {
      throw new Error(`Unsupported or unmapped language: '${langStr}'. Supported: c, cpp, java, python, javascript, go, rust, csharp, php`);
    }
    return id;
  }

  /**
   * Rate limiting enforcement
   */
  static async checkRateLimit(identifier, isAuthenticated = false) {
    const minIntervalMs = 3000; // 3 seconds between consecutive submissions
    const windowMs = 60 * 1000; // 1 minute window
    const limit = isAuthenticated ? 30 : 10; // 30 per min for logged in, 10 for anon
    const now = Date.now();
    const key = `rate:judge:${identifier}`;

    const recordStr = await redis.get(key);
    let record = recordStr ? JSON.parse(recordStr) : null;

    if (!record || record.resetAt <= now) {
      record = { count: 1, resetAt: now + windowMs, lastRequestAt: now };
      await redis.set(key, JSON.stringify(record), 'PX', windowMs);
      return true;
    }

    // Enforce minimum time between submissions to prevent spamming the queue
    if (now - record.lastRequestAt < minIntervalMs) {
      const waitSeconds = Math.ceil((minIntervalMs - (now - record.lastRequestAt)) / 1000);
      throw new Error(`Please wait ${waitSeconds}s before submitting again to prevent spam.`);
    }

    if (record.count >= limit) {
      const waitSeconds = Math.ceil((record.resetAt - now) / 1000);
      throw new Error(`Rate limit exceeded. Please wait ${waitSeconds}s before submitting again.`);
    }

    record.count++;
    record.lastRequestAt = now;
    await redis.set(key, JSON.stringify(record), 'PX', Math.max(1, record.resetAt - now));
    return true;
  }

  /**
   * Map Judge0 status IDs to application-level statuses and verdicts
   */
  static normalizeStatus(statusId, statusDescription) {
    switch (statusId) {
      case 3: // Accepted
        return { status: 'ACCEPTED', verdict: 'Accepted' };
      case 4: // Wrong Answer
        return { status: 'WRONG_ANSWER', verdict: 'Wrong Answer' };
      case 5: // Time Limit Exceeded
        return { status: 'TIME_LIMIT_EXCEEDED', verdict: 'Time Limit Exceeded' };
      case 6: // Compilation Error
        return { status: 'COMPILATION_ERROR', verdict: 'Compilation Error' };
      case 7: // Runtime Error (SIGSEGV)
      case 8: // Runtime Error (SIGXFSZ)
      case 9: // Runtime Error (SIGFPE)
      case 10: // Runtime Error (SIGABRT)
      case 11: // Runtime Error (NZEC)
      case 12: // Runtime Error (Other)
        return { status: 'RUNTIME_ERROR', verdict: 'Runtime Error' };
      case 13: // Internal Error
        return { status: 'INTERNAL_ERROR', verdict: 'Internal Error' };
      case 14: // Exec Format Error
        return { status: 'EXEC_FORMAT_ERROR', verdict: 'Execution Format Error' };
      default:
        return { status: 'UNKNOWN', verdict: statusDescription || 'Unknown Error' };
    }
  }

  /**
   * Poll Judge0 submission until it is finished or times out
   */
  static async pollSubmission(token, maxAttempts = 120, intervalMs = 500) {
    let attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;
      const result = await Judge0Service.getSubmission(token);

      // Status 1 = In Queue, Status 2 = Processing
      if (result.statusId !== 1 && result.statusId !== 2) {
        return result;
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error(`Submission ${token} timed out waiting for Judge0 execution to complete.`);
  }

  /**
   * Run code with arbitrary stdin and return normalized result
   */
  static async runCode({
    language,
    sourceCode,
    stdin = '',
    cpuTimeLimit = null,
    memoryLimit = null
  }) {
    // 1. Validation
    if (!sourceCode || !String(sourceCode).trim()) {
      throw new Error('Source code cannot be empty');
    }
    if (Buffer.byteLength(sourceCode, 'utf8') > 100 * 1024) {
      throw new Error('Source code exceeds maximum size limit of 100 KB');
    }
    if (stdin && Buffer.byteLength(stdin, 'utf8') > 1024 * 1024) {
      throw new Error('Stdin exceeds maximum size limit of 1 MB');
    }

    const languageId = this.resolveLanguageId(language);

    // 2. Submit to Judge0
    const { token } = await Judge0Service.createSubmission({
      sourceCode,
      languageId,
      stdin,
      cpuTimeLimit,
      memoryLimit
    });

    // 3. Poll for result
    const submission = await this.pollSubmission(token);

    // 4. Normalize response
    const { status, verdict } = this.normalizeStatus(submission.statusId, submission.statusDescription);
    const success = submission.statusId === 3;

    // Track metrics
    judge0SubmissionsTotal.inc({ language: String(language).toLowerCase(), status });

    return {
      success,
      status,
      verdict,
      token,
      stdout: submission.stdout || '',
      stderr: submission.stderr || '',
      compileOutput: submission.compileOutput || '',
      time: submission.time,
      memory: submission.memory,
      message: submission.message
    };
  }

  /**
   * Execute code against multiple test cases (for problem solving and exams)
   */
  static async executeTestCases({
    language,
    sourceCode,
    testCases = [],
    timeLimit = null,
    memoryLimit = null,
    isSubmit = false
  }) {
    if (!sourceCode || !String(sourceCode).trim()) {
      return {
        passed: false,
        totalScore: 0,
        maxScore: testCases.reduce((s, tc) => s + Number(tc.marks || 1), 0),
        results: testCases.map((tc, i) => ({
          input: isSubmit && tc.isHidden ? '[hidden]' : (tc.input || ''),
          expectedOutput: isSubmit && tc.isHidden ? '[hidden]' : (tc.expectedOutput || ''),
          actualOutput: '',
          passed: false,
          marks: tc.marks || 1,
          earnedMarks: 0,
          error: 'No code submitted',
          index: i
        }))
      };
    }

    if (Buffer.byteLength(sourceCode, 'utf8') > 100 * 1024) {
      throw new Error('Source code exceeds maximum size limit of 100 KB');
    }

    const languageId = this.resolveLanguageId(language);
    const cases = testCases.length ? testCases : [{ input: '', expectedOutput: '', marks: 1 }];
    const results = [];
    let compilationError = null;

    for (let i = 0; i < cases.length; i++) {
      const tc = cases[i];
      const stdin = tc.input || '';
      const expectedOutput = tc.expectedOutput || tc.output || '';

      // If we already detected a compilation error in a previous test case, skip remaining
      if (compilationError) {
        results.push({
          input: isSubmit && tc.isHidden ? '[hidden]' : stdin,
          expectedOutput: isSubmit && tc.isHidden ? '[hidden]' : expectedOutput,
          actualOutput: '',
          passed: false,
          marks: tc.marks || 1,
          earnedMarks: 0,
          error: `Compilation Error: ${compilationError}`,
          index: i
        });
        continue;
      }

      try {
        const { token } = await Judge0Service.createSubmission({
          sourceCode,
          languageId,
          stdin,
          expectedOutput: null, // We perform normalized verification server-side
          cpuTimeLimit: timeLimit,
          memoryLimit
        });

        const sub = await this.pollSubmission(token);
        const { status, verdict } = this.normalizeStatus(sub.statusId, sub.statusDescription);

        // Check for compilation failure
        if (status === 'COMPILATION_ERROR') {
          compilationError = sub.compileOutput || sub.stderr || 'Compilation failed';
          results.push({
            input: isSubmit && tc.isHidden ? '[hidden]' : stdin,
            expectedOutput: isSubmit && tc.isHidden ? '[hidden]' : expectedOutput,
            actualOutput: '',
            passed: false,
            marks: tc.marks || 1,
            earnedMarks: 0,
            error: `Compilation Error: ${compilationError}`,
            index: i
          });
          continue;
        }

        const normActual = normalizeOutput(sub.stdout);
        const normExpected = normalizeOutput(expectedOutput);

        let passed = false;
        let error = null;

        if (status === 'TIME_LIMIT_EXCEEDED') {
          error = 'Time Limit Exceeded';
        } else if (status === 'RUNTIME_ERROR') {
          error = `Runtime Error: ${sub.stderr || sub.message || 'Execution error'}`;
        } else if (!normExpected || normExpected === 'ANY' || normActual === normExpected) {
          passed = true;
        } else {
          error = 'Wrong Answer';
        }

        results.push({
          input: isSubmit && tc.isHidden ? '[hidden]' : stdin,
          expectedOutput: isSubmit && tc.isHidden ? '[hidden]' : expectedOutput,
          actualOutput: isSubmit && tc.isHidden ? (passed ? '[correct]' : '[wrong]') : normActual,
          passed,
          marks: tc.marks || 1,
          earnedMarks: passed ? (tc.marks || 1) : 0,
          executionTime: sub.time ? `${Math.round(sub.time * 1000)}ms` : undefined,
          memory: sub.memory ? `${sub.memory} KB` : undefined,
          error,
          index: i
        });
      } catch (err) {
        logger.error(`[CodeExecutionService] Error evaluating test case ${i}:`, err);
        results.push({
          input: isSubmit && tc.isHidden ? '[hidden]' : stdin,
          expectedOutput: isSubmit && tc.isHidden ? '[hidden]' : expectedOutput,
          actualOutput: '',
          passed: false,
          marks: tc.marks || 1,
          earnedMarks: 0,
          error: err.message || 'Execution failed',
          index: i
        });
      }
    }

    const totalScore = results.reduce((s, r) => s + r.earnedMarks, 0);
    const maxScore = results.reduce((s, r) => s + r.marks, 0);

    return {
      passed: results.every(r => r.passed),
      totalScore,
      maxScore,
      compilationError,
      results
    };
  }

  /**
   * Enqueue background job for /api/judge/submit
   */
  static async enqueueJob(jobId, task) {
    const jobKey = `job:${jobId}`;
    const initialJob = {
      jobId,
      status: 'queued',
      queuedAt: Date.now(),
      startedAt: null,
      finishedAt: null,
      result: null,
      error: null
    };

    await redis.set(jobKey, JSON.stringify(initialJob), 'EX', 3600); // 1 hour TTL

    // Asynchronously execute
    setImmediate(async () => {
      let currentJob = { ...initialJob, status: 'running', startedAt: Date.now() };
      await redis.set(jobKey, JSON.stringify(currentJob), 'EX', 3600);
      try {
        const result = await task();
        currentJob.status = 'done';
        currentJob.result = result;
      } catch (err) {
        currentJob.status = 'error';
        currentJob.error = err.message || 'Execution error';
      } finally {
        currentJob.finishedAt = Date.now();
        await redis.set(jobKey, JSON.stringify(currentJob), 'EX', 3600);
      }
    });

    return jobId;
  }

  /**
   * Get job status for /api/judge/job-status/:jobId
   */
  static async getJob(jobId) {
    const jobKey = `job:${jobId}`;
    const jobStr = await redis.get(jobKey);
    return jobStr ? JSON.parse(jobStr) : null;
  }
}
