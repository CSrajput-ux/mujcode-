import { BaseExecutionProvider } from './BaseExecutionProvider.js';
import { Judge0Service } from '../Judge0Service.js';
import { logger } from '../../lib/logger.js';
import { judge0SubmissionsTotal } from '../../lib/metrics.js';

// ─── Judge0 CE v1.13.1 — Verified Language ID Map ─────────────────────────────
// Source: https://github.com/judge0/judge0/blob/v1.13.1/db/languages/active.rb
export const JUDGE0_LANGUAGE_MAP = {
  // ── C ───────────────────────────────────────────────────────────────────────
  c:          50,   // C (GCC 9.2.0)
  c_gcc9:     50,
  c_gcc8:     49,
  c_gcc7:     48,

  // ── C++ ─────────────────────────────────────────────────────────────────────
  cpp:        54,   // C++ (GCC 9.2.0)
  'c++':      54,
  cplusplus:  54,
  cpp_gcc9:   54,
  cpp_gcc8:   53,
  cpp_gcc7:   52,

  // ── C# ──────────────────────────────────────────────────────────────────────
  csharp:     51,   // C# (Mono 6.6.0.161)
  'c#':       51,
  cs:         51,

  // ── Python ──────────────────────────────────────────────────────────────────
  python:     71,   // Python (3.8.1)
  python3:    71,
  py:         71,
  py3:        71,
  python2:    70,   // Python (2.7.17)
  py2:        70,

  // ── JavaScript / Node.js ────────────────────────────────────────────────────
  javascript: 63,   // JavaScript (Node.js 12.14.0)
  js:         63,
  node:       63,
  nodejs:     63,

  // ── TypeScript ──────────────────────────────────────────────────────────────
  typescript: 74,   // TypeScript (3.7.4)
  ts:         74,

  // ── Java ────────────────────────────────────────────────────────────────────
  java:       62,   // Java (OpenJDK 13.0.1)
  java13:     62,

  // ── Go / Golang ─────────────────────────────────────────────────────────────
  go:         60,   // Go (1.13.5)
  golang:     60,
  go113:      60,

  // ── Rust ────────────────────────────────────────────────────────────────────
  rust:       73,   // Rust (1.40.0)
  rs:         73,

  // ── PHP ─────────────────────────────────────────────────────────────────────
  php:        68,   // PHP (7.4.1)

  // ── Ruby ────────────────────────────────────────────────────────────────────
  ruby:       72,   // Ruby (2.7.0)
  rb:         72,

  // ── Bash / Shell ────────────────────────────────────────────────────────────
  bash:       46,   // Bash (5.0.0)
  sh:         46
};

let _liveLanguagesCache = null;
let _liveLanguagesFetchedAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

function normalizeOutput(str) {
  return String(str || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trim();
}

export class Judge0ExecutionProvider extends BaseExecutionProvider {
  constructor() {
    super('judge0');
  }

  /**
   * Resolve language name or alias to Judge0 language ID
   */
  static resolveLanguageId(langStr) {
    if (!langStr) return JUDGE0_LANGUAGE_MAP.python;
    const clean = String(langStr).toLowerCase().trim();

    const asNum = Number(clean);
    if (!isNaN(asNum) && asNum > 0 && Number.isInteger(asNum)) {
      return asNum;
    }

    const id = JUDGE0_LANGUAGE_MAP[clean];
    if (!id) {
      const supported = [...new Set(Object.keys(JUDGE0_LANGUAGE_MAP))].sort().join(', ');
      throw new Error(`Unsupported Judge0 language: '${langStr}'.\nSupported: ${supported}`);
    }
    return id;
  }

  /**
   * Normalize Judge0 status IDs to application statuses
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
   * Poll submission until completion or timeout
   */
  static async pollSubmission(token, maxAttempts = 120, intervalMs = 500) {
    let attempts = 0;
    while (attempts < maxAttempts) {
      attempts++;
      const result = await Judge0Service.getSubmission(token);
      // status_id: 1 = In Queue, 2 = Processing
      if (result.statusId !== 1 && result.statusId !== 2) return result;
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    throw new Error(`Submission ${token} timed out after ${maxAttempts} poll attempts.`);
  }

  /**
   * Run single code execution with stdin
   */
  async runCode({ language, sourceCode, stdin = '', timeLimit = null, memoryLimit = null }) {
    if (!sourceCode || !String(sourceCode).trim()) {
      throw new Error('Source code cannot be empty');
    }
    if (Buffer.byteLength(sourceCode, 'utf8') > 100 * 1024) {
      throw new Error('Source code exceeds 100 KB limit');
    }
    if (stdin && Buffer.byteLength(stdin, 'utf8') > 1024 * 1024) {
      throw new Error('Stdin exceeds 1 MB limit');
    }

    const languageId = Judge0ExecutionProvider.resolveLanguageId(language);
    const { token } = await Judge0Service.createSubmission({
      sourceCode,
      languageId,
      stdin,
      cpuTimeLimit: timeLimit,
      memoryLimit
    });

    const submission = await Judge0ExecutionProvider.pollSubmission(token);
    const { status, verdict } = Judge0ExecutionProvider.normalizeStatus(submission.statusId, submission.statusDescription);

    judge0SubmissionsTotal.inc({ language: String(language).toLowerCase(), status });

    return {
      success: submission.statusId === 3,
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
   * Run code against multiple test cases in parallel
   */
  async executeTestCases({
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
      throw new Error('Source code exceeds 100 KB limit');
    }

    const languageId = Judge0ExecutionProvider.resolveLanguageId(language);
    const cases = testCases.length ? testCases : [{ input: '', expectedOutput: '', marks: 1 }];
    let compilationError = null;

    // Submit all test cases to Judge0 in parallel
    const submissions = await Promise.all(
      cases.map(tc =>
        Judge0Service.createSubmission({
          sourceCode,
          languageId,
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
        return Judge0ExecutionProvider.pollSubmission(s.token)
          .then(sub => ({ ...sub, index: i }))
          .catch(err => ({ _error: err.message, index: i }));
      })
    );

    const results = [];
    for (let i = 0; i < cases.length; i++) {
      const tc = cases[i];
      const sub = polledResults[i];
      const stdin = tc.input || '';
      const expectedOutput = tc.expectedOutput || tc.output || '';

      if (sub._error) {
        results.push({
          input: isSubmit && tc.isHidden ? '[hidden]' : stdin,
          expectedOutput: isSubmit && tc.isHidden ? '[hidden]' : expectedOutput,
          actualOutput: '',
          passed: false,
          marks: tc.marks || 1,
          earnedMarks: 0,
          error: sub._error,
          index: i
        });
        continue;
      }

      const { status } = Judge0ExecutionProvider.normalizeStatus(sub.statusId, sub.statusDescription);

      if (status === 'COMPILATION_ERROR' && !compilationError) {
        compilationError = sub.compileOutput || sub.stderr || 'Compilation failed';
      }
      if (compilationError && status === 'COMPILATION_ERROR') {
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
    }

    return {
      passed: results.every(r => r.passed),
      totalScore: results.reduce((s, r) => s + r.earnedMarks, 0),
      maxScore: results.reduce((s, r) => s + r.marks, 0),
      compilationError,
      results
    };
  }

  /**
   * Return supported languages from Judge0
   */
  async getSupportedLanguages() {
    const now = Date.now();
    if (_liveLanguagesCache && (now - _liveLanguagesFetchedAt) < CACHE_TTL_MS) {
      return _liveLanguagesCache;
    }

    try {
      const languages = await Judge0Service.getLanguages();
      if (Array.isArray(languages) && languages.length > 0) {
        _liveLanguagesCache = languages;
        _liveLanguagesFetchedAt = now;
        return _liveLanguagesCache;
      }
    } catch (err) {
      logger.warn(`[Judge0ExecutionProvider] Failed live discovery: ${err.message}. Using built-in map.`);
    }

    const seen = new Set();
    return Object.entries(JUDGE0_LANGUAGE_MAP)
      .filter(([, id]) => { if (seen.has(id)) return false; seen.add(id); return true; })
      .map(([name, id]) => ({ id, name }))
      .sort((a, b) => a.id - b.id);
  }

  /**
   * Health check for Judge0
   */
  async checkHealth() {
    return Judge0Service.checkHealth();
  }
}
