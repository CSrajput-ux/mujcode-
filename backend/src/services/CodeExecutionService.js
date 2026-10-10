import { Judge0Service } from './Judge0Service.js';
import { ExecutionProviderFactory } from './providers/ExecutionProviderFactory.js';
import { JUDGE0_LANGUAGE_MAP, Judge0ExecutionProvider } from './providers/Judge0ExecutionProvider.js';
import { logger } from '../lib/logger.js';
import { judge0SubmissionsTotal } from '../lib/metrics.js';
import { redis } from '../config/redis.js';

export const LANGUAGE_MAP = {
  ...JUDGE0_LANGUAGE_MAP,
  sql: 'sql',
  sqlite: 'sqlite'
};

export class CodeExecutionService {
  /**
   * Resolve a language string (e.g., 'python', 'java', 'cpp') to a Judge0 Language ID.
   * Preserved for Judge0 ID lookups and legacy callers.
   */
  static resolveLanguageId(langStr) {
    if (!langStr) return JUDGE0_LANGUAGE_MAP.python;
    const clean = String(langStr).toLowerCase().trim();

    if (clean === 'sql' || clean === 'sqlite') {
      return 82; // Judge0 legacy SQLite ID
    }

    const approvedIds = new Set([50, 54, 62, 71, 63, 60, 82]);
    const asNum = Number(clean);
    if (!isNaN(asNum) && asNum > 0 && Number.isInteger(asNum)) {
      if (!approvedIds.has(asNum)) {
        throw new Error(`Unsupported language ID: ${asNum}. MUJCODE Compiler Engine supports strictly 7 language families.`);
      }
      return asNum;
    }

    const id = JUDGE0_LANGUAGE_MAP[clean];
    if (!id || !approvedIds.has(id)) {
      const supported = ['c', 'cpp', 'java', 'python', 'javascript', 'go', 'sql'].join(', ');
      throw new Error(`Unsupported language: '${langStr}'.\nSupported languages: ${supported}`);
    }
    return id;
  }

  /**
   * Return all supported language names (for frontend language selector).
   * Exposes strictly the 7 approved language families.
   */
  static async getSupportedLanguages() {
    return [
      { id: 50, name: 'C (GCC)', language: 'c', extension: '.c' },
      { id: 54, name: 'C++ (G++)', language: 'cpp', extension: '.cpp' },
      { id: 62, name: 'Java (OpenJDK)', language: 'java', extension: '.java' },
      { id: 71, name: 'Python (Python 3)', language: 'python', extension: '.py' },
      { id: 63, name: 'JavaScript (Node.js)', language: 'javascript', extension: '.js' },
      { id: 60, name: 'Go (Golang)', language: 'go', extension: '.go' },
      { id: 82, name: 'SQL (Isolated Engine)', language: 'sql', extension: '.sql' }
    ];
  }

  /**
   * Rate limiting enforcement
   */
  static async checkRateLimit(identifier, isAuthenticated = false) {
    const minIntervalMs = 3000;
    const windowMs = 60 * 1000;
    const limit = isAuthenticated ? 30 : 10;
    const now = Date.now();
    const key = `rate:judge:${identifier}`;

    const recordStr = await redis.get(key);
    let record = recordStr ? JSON.parse(recordStr) : null;

    if (!record || record.resetAt <= now) {
      record = { count: 1, resetAt: now + windowMs, lastRequestAt: now };
      await redis.set(key, JSON.stringify(record), 'PX', windowMs);
      return true;
    }

    if (now - record.lastRequestAt < minIntervalMs) {
      const waitSeconds = Math.ceil((minIntervalMs - (now - record.lastRequestAt)) / 1000);
      throw new Error(`Please wait ${waitSeconds}s before submitting again.`);
    }

    if (record.count >= limit) {
      const waitSeconds = Math.ceil((record.resetAt - now) / 1000);
      throw new Error(`Rate limit exceeded. Please wait ${waitSeconds}s.`);
    }

    record.count++;
    record.lastRequestAt = now;
    await redis.set(key, JSON.stringify(record), 'PX', Math.max(1, record.resetAt - now));
    return true;
  }

  /**
   * Map Judge0 status IDs to application-level statuses
   */
  static normalizeStatus(statusId, statusDescription) {
    return Judge0ExecutionProvider.normalizeStatus(statusId, statusDescription);
  }

  /**
   * Poll Judge0 submission until finished
   */
  static async pollSubmission(token, maxAttempts = 120, intervalMs = 500) {
    return Judge0ExecutionProvider.pollSubmission(token, maxAttempts, intervalMs);
  }

  /**
   * Run single code execution with arbitrary stdin
   * Dynamically delegates to SqlExecutionProvider or Judge0ExecutionProvider.
   */
  static async runCode({
    language,
    sourceCode,
    stdin = '',
    cpuTimeLimit = null,
    memoryLimit = null,
    schemaSql = '',
    seedSql = '',
    rowLimit = null
  }) {
    if (!sourceCode || !String(sourceCode).trim()) {
      throw new Error('Source code cannot be empty');
    }
    if (Buffer.byteLength(sourceCode, 'utf8') > 100 * 1024) {
      throw new Error('Source code exceeds 100 KB limit');
    }
    if (stdin && Buffer.byteLength(stdin, 'utf8') > 1024 * 1024) {
      throw new Error('Stdin exceeds 1 MB limit');
    }

    const provider = ExecutionProviderFactory.getProvider(language);
    return provider.runCode({
      language,
      sourceCode,
      stdin,
      timeLimit: cpuTimeLimit,
      memoryLimit,
      schemaSql,
      seedSql,
      rowLimit
    });
  }

  /**
   * Execute code against multiple test cases
   * Dynamically delegates to SqlExecutionProvider or Judge0ExecutionProvider.
   */
  static async executeTestCases({
    language,
    sourceCode,
    testCases = [],
    timeLimit = null,
    memoryLimit = null,
    schemaSql = '',
    seedSql = '',
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
      throw new Error('Source code exceeds 100 KB limit');
    }

    const provider = ExecutionProviderFactory.getProvider(language);
    return provider.executeTestCases({
      language,
      sourceCode,
      testCases,
      timeLimit,
      memoryLimit,
      schemaSql,
      seedSql,
      isSubmit
    });
  }

  /**
   * Direct execution of SQL queries in the isolated SQLite environment
   */
  static async executeSql({ query, schemaSql = '', seedSql = '', rowLimit = 100, timeLimit = 2 }) {
    const sqlProvider = ExecutionProviderFactory.getSqlProvider();
    return sqlProvider.runCode({
      sourceCode: query,
      schemaSql,
      seedSql,
      rowLimit,
      timeLimit
    });
  }

  /**
   * Enqueue background job (tracked in Redis or memory store) with caller ownership
   */
  static async enqueueJob(jobId, userIdOrTask, maybeTask) {
    let userId = null;
    let task = null;

    if (typeof userIdOrTask === 'function') {
      task = userIdOrTask;
      userId = null;
    } else {
      userId = userIdOrTask;
      task = maybeTask;
    }

    const jobKey = `job:${jobId}`;
    const initialJob = {
      jobId,
      userId: userId ? String(userId) : null,
      status: 'queued',
      queuedAt: Date.now(),
      startedAt: null,
      finishedAt: null,
      result: null,
      error: null
    };

    await redis.set(jobKey, JSON.stringify(initialJob), 'EX', 3600);

    setImmediate(async () => {
      let currentJob = { ...initialJob, status: 'running', startedAt: Date.now() };
      await redis.set(jobKey, JSON.stringify(currentJob), 'EX', 3600);
      try {
        currentJob.result = await task();
        currentJob.status = 'done';
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
   * Get job status
   */
  static async getJob(jobId) {
    const jobStr = await redis.get(`job:${jobId}`);
    return jobStr ? JSON.parse(jobStr) : null;
  }

  /**
   * Check overall health of all execution providers
   */
  static async checkHealth() {
    return ExecutionProviderFactory.checkAllHealth();
  }
}
