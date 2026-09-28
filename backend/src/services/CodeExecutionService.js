import { Judge0Service } from './Judge0Service.js';
import { logger } from '../lib/logger.js';
import { judge0SubmissionsTotal } from '../lib/metrics.js';
import { redis } from '../config/redis.js';

// ─── Judge0 CE v1.13.1 — VERIFIED Language ID Map ─────────────────────────────
// Source: https://github.com/judge0/judge0/blob/v1.13.1/db/languages/active.rb
// These are the ONLY valid IDs for the self-hosted judge0/judge0:v1.13.1 image.
// IDs 43–89 are active. IDs 1–42 are archived (still work but deprecated).
//
// ⚠️  IDs like 91, 92, 93, 95, 97–113 are from ce.judge0.com (newer hosted version)
//     and DO NOT exist in v1.13.1. Using them will return 404 from Judge0.
// ─────────────────────────────────────────────────────────────────────────────────
const LANGUAGE_MAP = {
  // ── C ───────────────────────────────────────────────────────────────────────
  c:          50,   // C (GCC 9.2.0)      — latest C in v1.13.1
  c_gcc9:     50,   // C (GCC 9.2.0)
  c_gcc8:     49,   // C (GCC 8.3.0)
  c_gcc7:     48,   // C (GCC 7.4.0)

  // ── C++ ─────────────────────────────────────────────────────────────────────
  cpp:        54,   // C++ (GCC 9.2.0)    — latest C++ in v1.13.1
  'c++':      54,
  cplusplus:  54,
  cpp_gcc9:   54,   // C++ (GCC 9.2.0)
  cpp_gcc8:   53,   // C++ (GCC 8.3.0)
  cpp_gcc7:   52,   // C++ (GCC 7.4.0)

  // ── C# ──────────────────────────────────────────────────────────────────────
  csharp:     51,   // C# (Mono 6.6.0.161)
  'c#':       51,
  cs:         51,
  dotnet:     51,

  // ── Python ──────────────────────────────────────────────────────────────────
  python:     71,   // Python (3.8.1)     — only Python 3 version in v1.13.1
  python3:    71,
  py:         71,
  py3:        71,
  python38:   71,
  python2:    70,   // Python (2.7.17)    — legacy
  py2:        70,

  // ── JavaScript / Node.js ────────────────────────────────────────────────────
  javascript: 63,   // JavaScript (Node.js 12.14.0) — only JS version in v1.13.1
  js:         63,
  node:       63,
  nodejs:     63,
  node12:     63,

  // ── TypeScript ──────────────────────────────────────────────────────────────
  typescript: 74,   // TypeScript (3.7.4) — only TS version in v1.13.1
  ts:         74,

  // ── Java ────────────────────────────────────────────────────────────────────
  java:       62,   // Java (OpenJDK 13.0.1) — only Java version in v1.13.1
  java13:     62,

  // ── Go / Golang ─────────────────────────────────────────────────────────────
  go:         60,   // Go (1.13.5)        — only Go version in v1.13.1
  golang:     60,
  go113:      60,

  // ── Rust ────────────────────────────────────────────────────────────────────
  rust:       73,   // Rust (1.40.0)      — only Rust version in v1.13.1
  rs:         73,

  // ── PHP ─────────────────────────────────────────────────────────────────────
  php:        68,   // PHP (7.4.1)        — only PHP version in v1.13.1
  php7:       68,

  // ── Kotlin ──────────────────────────────────────────────────────────────────
  kotlin:     78,   // Kotlin (1.3.70)
  kt:         78,

  // ── Swift ───────────────────────────────────────────────────────────────────
  swift:      83,   // Swift (5.2.3)

  // ── Ruby ────────────────────────────────────────────────────────────────────
  ruby:       72,   // Ruby (2.7.0)
  rb:         72,

  // ── Scala ───────────────────────────────────────────────────────────────────
  scala:      81,   // Scala (2.13.2)
  scala2:     81,

  // ── R ───────────────────────────────────────────────────────────────────────
  r:          80,   // R (4.0.0)
  rlang:      80,

  // ── Bash / Shell ────────────────────────────────────────────────────────────
  bash:       46,   // Bash (5.0.0)
  sh:         46,
  shell:      46,

  // ── SQL ─────────────────────────────────────────────────────────────────────
  sql:        82,   // SQL (SQLite 3.27.2)
  sqlite:     82,

  // ── Lua ─────────────────────────────────────────────────────────────────────
  lua:        64,   // Lua (5.3.5)

  // ── Haskell ─────────────────────────────────────────────────────────────────
  haskell:    61,   // Haskell (GHC 8.8.1)

  // ── Dart ────────────────────────────────────────────────────────────────────
  dart:       90,   // Dart (2.19.2)

  // ── Clojure ─────────────────────────────────────────────────────────────────
  clojure:    86,   // Clojure (1.10.1)

  // ── Elixir ──────────────────────────────────────────────────────────────────
  elixir:     57,   // Elixir (1.9.4)

  // ── Erlang ──────────────────────────────────────────────────────────────────
  erlang:     58,   // Erlang (OTP 22.2)

  // ── Fortran ─────────────────────────────────────────────────────────────────
  fortran:    59,   // Fortran (GFortran 9.2.0)

  // ── Groovy ──────────────────────────────────────────────────────────────────
  groovy:     88,   // Groovy (3.0.3)

  // ── Objective-C ─────────────────────────────────────────────────────────────
  objc:       79,   // Objective-C (Clang 7.0.1)
  'objective-c': 79,

  // ── OCaml ───────────────────────────────────────────────────────────────────
  ocaml:      65,   // OCaml (4.09.0)

  // ── Octave (MATLAB-compatible) ───────────────────────────────────────────────
  octave:     66,   // Octave (5.1.0)
  matlab:     66,

  // ── Pascal ──────────────────────────────────────────────────────────────────
  pascal:     67,   // Pascal (FPC 3.0.4)

  // ── Perl ────────────────────────────────────────────────────────────────────
  perl:       85,   // Perl (5.28.1)

  // ── Prolog ──────────────────────────────────────────────────────────────────
  prolog:     69,   // Prolog (GNU Prolog 1.4.5)

  // ── F# ──────────────────────────────────────────────────────────────────────
  fsharp:     87,   // F# (.NET Core SDK 3.1.202)
  'f#':       87,

  // ── COBOL ───────────────────────────────────────────────────────────────────
  cobol:      77,   // COBOL (GnuCOBOL 2.2)

  // ── Common Lisp ─────────────────────────────────────────────────────────────
  lisp:       55,   // Common Lisp (SBCL 2.0.0)
  commonlisp: 55,

  // ── D ───────────────────────────────────────────────────────────────────────
  d:          56,   // D (DMD 2.089.1)

  // ── Assembly ────────────────────────────────────────────────────────────────
  assembly:   45,   // Assembly (NASM 2.14.02)
  asm:        45,
  nasm:       45,

  // ── Basic ───────────────────────────────────────────────────────────────────
  basic:      47,   // Basic (FBC 1.07.1)

  // ── Visual Basic.Net ────────────────────────────────────────────────────────
  vb:         84,   // Visual Basic.Net (vbnc 0.0.0.5943)
  vbnet:      84,

  // ── Plain Text / Multi-file ──────────────────────────────────────────────────
  text:       43,   // Plain Text
  plaintext:  43,
  multifile:  89,   // Multi-file program
};

// Cache of live language IDs fetched from the running Judge0 instance.
// Refreshed once per server start. If Judge0 is down, falls back to LANGUAGE_MAP.
let _liveLanguageCache = null;
let _liveCacheFetchedAt = 0;
const LIVE_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function getLiveLanguageMap() {
  const now = Date.now();
  if (_liveLanguageCache && (now - _liveCacheFetchedAt) < LIVE_CACHE_TTL_MS) {
    return _liveLanguageCache;
  }
  try {
    const languages = await Judge0Service.getLanguages();
    if (Array.isArray(languages) && languages.length > 0) {
      _liveLanguageCache = languages; // [{id, name}, ...]
      _liveCacheFetchedAt = now;
      logger.info(`[Judge0] Loaded ${languages.length} live languages from Judge0.`);
    }
  } catch (err) {
    logger.warn(`[Judge0] Could not fetch live languages: ${err.message}. Using built-in map.`);
  }
  return _liveLanguageCache;
}

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
   * Resolve a language string (e.g., 'python', 'java', 'cpp') to a Judge0 Language ID.
   * Uses built-in verified map for v1.13.1.
   */
  static resolveLanguageId(langStr) {
    if (!langStr) return LANGUAGE_MAP.python;
    const clean = String(langStr).toLowerCase().trim();

    // Allow passing a raw numeric language ID directly
    const asNum = Number(clean);
    if (!isNaN(asNum) && asNum > 0 && Number.isInteger(asNum)) {
      return asNum;
    }

    const id = LANGUAGE_MAP[clean];
    if (!id) {
      const supported = [...new Set(Object.keys(LANGUAGE_MAP))].sort().join(', ');
      throw new Error(`Unsupported language: '${langStr}'.\nSupported aliases: ${supported}`);
    }
    return id;
  }

  /**
   * Return all supported language names (for frontend language selector).
   * Fetches live from Judge0 if available, otherwise returns built-in list.
   */
  static async getSupportedLanguages() {
    const live = await getLiveLanguageMap();
    if (live) return live;

    // Fallback: return unique entries from built-in map
    const seen = new Set();
    return Object.entries(LANGUAGE_MAP)
      .filter(([, id]) => { if (seen.has(id)) return false; seen.add(id); return true; })
      .map(([name, id]) => ({ id, name }))
      .sort((a, b) => a.id - b.id);
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
    switch (statusId) {
      case 3:  return { status: 'ACCEPTED',            verdict: 'Accepted' };
      case 4:  return { status: 'WRONG_ANSWER',        verdict: 'Wrong Answer' };
      case 5:  return { status: 'TIME_LIMIT_EXCEEDED', verdict: 'Time Limit Exceeded' };
      case 6:  return { status: 'COMPILATION_ERROR',   verdict: 'Compilation Error' };
      case 7:
      case 8:
      case 9:
      case 10:
      case 11:
      case 12: return { status: 'RUNTIME_ERROR',       verdict: 'Runtime Error' };
      case 13: return { status: 'INTERNAL_ERROR',      verdict: 'Internal Error' };
      case 14: return { status: 'EXEC_FORMAT_ERROR',   verdict: 'Execution Format Error' };
      default: return { status: 'UNKNOWN',             verdict: statusDescription || 'Unknown' };
    }
  }

  /**
   * Poll Judge0 submission until finished
   */
  static async pollSubmission(token, maxAttempts = 120, intervalMs = 500) {
    let attempts = 0;
    while (attempts < maxAttempts) {
      attempts++;
      const result = await Judge0Service.getSubmission(token);
      if (result.statusId !== 1 && result.statusId !== 2) return result;
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    throw new Error(`Submission ${token} timed out after ${maxAttempts} poll attempts.`);
  }

  /**
   * Run code with arbitrary stdin
   */
  static async runCode({ language, sourceCode, stdin = '', cpuTimeLimit = null, memoryLimit = null }) {
    if (!sourceCode || !String(sourceCode).trim()) throw new Error('Source code cannot be empty');
    if (Buffer.byteLength(sourceCode, 'utf8') > 100 * 1024) throw new Error('Source code exceeds 100 KB limit');
    if (stdin && Buffer.byteLength(stdin, 'utf8') > 1024 * 1024) throw new Error('Stdin exceeds 1 MB limit');

    const languageId = this.resolveLanguageId(language);
    const { token } = await Judge0Service.createSubmission({ sourceCode, languageId, stdin, cpuTimeLimit, memoryLimit });
    const submission = await this.pollSubmission(token);
    const { status, verdict } = this.normalizeStatus(submission.statusId, submission.statusDescription);

    judge0SubmissionsTotal.inc({ language: String(language).toLowerCase(), status });

    return {
      success: submission.statusId === 3,
      status, verdict, token,
      stdout: submission.stdout || '',
      stderr: submission.stderr || '',
      compileOutput: submission.compileOutput || '',
      time: submission.time,
      memory: submission.memory,
      message: submission.message
    };
  }

  /**
   * Execute code against multiple test cases — PARALLEL for max speed
   */
  static async executeTestCases({ language, sourceCode, testCases = [], timeLimit = null, memoryLimit = null, isSubmit = false }) {
    if (!sourceCode || !String(sourceCode).trim()) {
      return {
        passed: false, totalScore: 0,
        maxScore: testCases.reduce((s, tc) => s + Number(tc.marks || 1), 0),
        results: testCases.map((tc, i) => ({
          input: isSubmit && tc.isHidden ? '[hidden]' : (tc.input || ''),
          expectedOutput: isSubmit && tc.isHidden ? '[hidden]' : (tc.expectedOutput || ''),
          actualOutput: '', passed: false, marks: tc.marks || 1, earnedMarks: 0,
          error: 'No code submitted', index: i
        }))
      };
    }

    if (Buffer.byteLength(sourceCode, 'utf8') > 100 * 1024) {
      throw new Error('Source code exceeds 100 KB limit');
    }

    const languageId = this.resolveLanguageId(language);
    const cases = testCases.length ? testCases : [{ input: '', expectedOutput: '', marks: 1 }];
    let compilationError = null;

    // Submit ALL test cases to Judge0 in PARALLEL
    const submissions = await Promise.all(
      cases.map(tc =>
        Judge0Service.createSubmission({
          sourceCode, languageId,
          stdin: tc.input || '',
          expectedOutput: null,
          cpuTimeLimit: timeLimit,
          memoryLimit
        }).catch(err => ({ _error: err.message }))
      )
    );

    // Poll all tokens in parallel
    const polledResults = await Promise.all(
      submissions.map((s, i) => {
        if (s._error) return Promise.resolve({ _error: s._error, index: i });
        return this.pollSubmission(s.token)
          .then(sub => ({ ...sub, index: i }))
          .catch(err => ({ _error: err.message, index: i }));
      })
    );

    const results = [];
    for (let i = 0; i < cases.length; i++) {
      const tc  = cases[i];
      const sub = polledResults[i];
      const stdin          = tc.input || '';
      const expectedOutput = tc.expectedOutput || tc.output || '';

      if (sub._error) {
        results.push({ input: isSubmit && tc.isHidden ? '[hidden]' : stdin, expectedOutput: isSubmit && tc.isHidden ? '[hidden]' : expectedOutput, actualOutput: '', passed: false, marks: tc.marks || 1, earnedMarks: 0, error: sub._error, index: i });
        continue;
      }

      const { status } = this.normalizeStatus(sub.statusId, sub.statusDescription);

      if (status === 'COMPILATION_ERROR' && !compilationError) {
        compilationError = sub.compileOutput || sub.stderr || 'Compilation failed';
      }
      if (compilationError && status === 'COMPILATION_ERROR') {
        results.push({ input: isSubmit && tc.isHidden ? '[hidden]' : stdin, expectedOutput: isSubmit && tc.isHidden ? '[hidden]' : expectedOutput, actualOutput: '', passed: false, marks: tc.marks || 1, earnedMarks: 0, error: `Compilation Error: ${compilationError}`, index: i });
        continue;
      }

      const normActual   = normalizeOutput(sub.stdout);
      const normExpected = normalizeOutput(expectedOutput);
      let passed = false;
      let error  = null;

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
        passed, marks: tc.marks || 1, earnedMarks: passed ? (tc.marks || 1) : 0,
        executionTime: sub.time ? `${Math.round(sub.time * 1000)}ms` : undefined,
        memory: sub.memory ? `${sub.memory} KB` : undefined,
        error, index: i
      });
    }

    return {
      passed: results.every(r => r.passed),
      totalScore: results.reduce((s, r) => s + r.earnedMarks, 0),
      maxScore:   results.reduce((s, r) => s + r.marks, 0),
      compilationError, results
    };
  }

  /**
   * Enqueue background job
   */
  static async enqueueJob(jobId, task) {
    const jobKey = `job:${jobId}`;
    const initialJob = { jobId, status: 'queued', queuedAt: Date.now(), startedAt: null, finishedAt: null, result: null, error: null };
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
}
