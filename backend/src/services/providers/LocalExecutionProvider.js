import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { BaseExecutionProvider } from './BaseExecutionProvider.js';
import { logger } from '../../lib/logger.js';
import { nextId } from '../../lib/ids.js';

function normalizeOutput(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
}

/**
 * Execute a child process with stdin piping, timeout, and buffer capping.
 */
function runProcess(cmd, args, { stdin = '', timeoutMs = 5000, cwd = process.cwd() } = {}) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let isTimedOut = false;
    let isFinished = false;

    let child;
    try {
      child = spawn(cmd, args, {
        cwd,
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } catch (err) {
      return resolve({
        exitCode: 1,
        stdout: '',
        stderr: err.message || 'Failed to spawn process',
        time: (Date.now() - startTime) / 1000,
        isTimedOut: false
      });
    }

    const timer = setTimeout(() => {
      isTimedOut = true;
      try {
        child.kill('SIGKILL');
      } catch {}
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      if (stdout.length < 512 * 1024) {
        stdout += chunk.toString('utf-8');
      }
    });

    child.stderr.on('data', (chunk) => {
      if (stderr.length < 512 * 1024) {
        stderr += chunk.toString('utf-8');
      }
    });

    if (stdin) {
      try {
        child.stdin.write(stdin);
        child.stdin.end();
      } catch {}
    } else {
      try {
        child.stdin.end();
      } catch {}
    }

    child.on('error', (err) => {
      if (isFinished) return;
      isFinished = true;
      clearTimeout(timer);
      resolve({
        exitCode: 1,
        stdout,
        stderr: stderr || err.message,
        time: (Date.now() - startTime) / 1000,
        isTimedOut
      });
    });

    child.on('close', (code) => {
      if (isFinished) return;
      isFinished = true;
      clearTimeout(timer);
      resolve({
        exitCode: code ?? 0,
        stdout,
        stderr,
        time: (Date.now() - startTime) / 1000,
        isTimedOut
      });
    });
  });
}

function extractJavaClassName(sourceCode) {
  const pubMatch = sourceCode.match(/public\s+class\s+([A-Za-z0-9_$]+)/);
  if (pubMatch) return pubMatch[1];
  const mainMatch = sourceCode.match(/class\s+([A-Za-z0-9_$]+)[^{]*\{[\s\S]*?public\s+static\s+void\s+main/);
  if (mainMatch) return mainMatch[1];
  const anyMatch = sourceCode.match(/class\s+([A-Za-z0-9_$]+)/);
  if (anyMatch) return anyMatch[1];
  return 'Main';
}

/**
 * LocalExecutionProvider — High-performance native compiler & execution engine.
 * Supports C, C++, Python, JavaScript, and Java using locally installed tools.
 */
export class LocalExecutionProvider extends BaseExecutionProvider {
  constructor() {
    super('local');
    this.gccPath = 'gcc';
    this.gppPath = 'g++';
    this.pythonPath = 'python';
    this.nodePath = process.execPath;
    this.javaPath = 'java';
    this.javacPath = 'javac';
  }

  normalizeLanguage(langStr) {
    const clean = String(langStr || 'c').toLowerCase().trim();
    if (clean === 'c' || clean === 'c (gcc)') return 'c';
    if (clean === 'cpp' || clean === 'c++' || clean === 'c++ (g++)') return 'cpp';
    if (clean === 'py' || clean === 'python' || clean === 'python3') return 'python';
    if (clean === 'js' || clean === 'javascript' || clean === 'node') return 'javascript';
    if (clean === 'java') return 'java';
    return clean;
  }

  async runCode({ language, sourceCode, stdin = '', timeLimit = 5 }) {
    if (!sourceCode || !String(sourceCode).trim()) {
      throw new Error('Source code cannot be empty');
    }

    const lang = this.normalizeLanguage(language);
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `muj_exec_${nextId('loc')}_`));
    const timeoutMs = Math.max(1000, Math.min(10000, (Number(timeLimit) || 5) * 1000));

    try {
      if (lang === 'c') {
        const srcFile = path.join(tmpDir, 'source.c');
        const exeFile = path.join(tmpDir, 'out.exe');
        fs.writeFileSync(srcFile, sourceCode, 'utf-8');

        // Compile
        const comp = await runProcess(this.gccPath, ['-O2', srcFile, '-o', exeFile], { cwd: tmpDir, timeoutMs: 10000 });
        if (comp.exitCode !== 0) {
          return {
            success: false,
            status: 'COMPILATION_ERROR',
            verdict: 'Compilation Error',
            stdout: '',
            stderr: comp.stderr,
            compileOutput: comp.stderr,
            time: comp.time,
            memory: 0
          };
        }

        // Run
        const run = await runProcess(exeFile, [], { stdin, cwd: tmpDir, timeoutMs });
        if (run.isTimedOut) {
          return {
            success: false,
            status: 'TIME_LIMIT_EXCEEDED',
            verdict: 'Time Limit Exceeded',
            stdout: run.stdout,
            stderr: 'Time Limit Exceeded: Code execution exceeded maximum allowed time.',
            compileOutput: '',
            time: run.time,
            memory: 0
          };
        }

        return {
          success: run.exitCode === 0,
          status: run.exitCode === 0 ? 'ACCEPTED' : 'RUNTIME_ERROR',
          verdict: run.exitCode === 0 ? 'Accepted' : 'Runtime Error',
          stdout: run.stdout,
          stderr: run.stderr,
          compileOutput: '',
          time: run.time,
          memory: 0
        };
      }

      if (lang === 'cpp') {
        const srcFile = path.join(tmpDir, 'source.cpp');
        const exeFile = path.join(tmpDir, 'out.exe');
        fs.writeFileSync(srcFile, sourceCode, 'utf-8');

        // Compile
        const comp = await runProcess(this.gppPath, ['-O2', srcFile, '-o', exeFile], { cwd: tmpDir, timeoutMs: 10000 });
        if (comp.exitCode !== 0) {
          return {
            success: false,
            status: 'COMPILATION_ERROR',
            verdict: 'Compilation Error',
            stdout: '',
            stderr: comp.stderr,
            compileOutput: comp.stderr,
            time: comp.time,
            memory: 0
          };
        }

        // Run
        const run = await runProcess(exeFile, [], { stdin, cwd: tmpDir, timeoutMs });
        if (run.isTimedOut) {
          return {
            success: false,
            status: 'TIME_LIMIT_EXCEEDED',
            verdict: 'Time Limit Exceeded',
            stdout: run.stdout,
            stderr: 'Time Limit Exceeded: Code execution exceeded maximum allowed time.',
            compileOutput: '',
            time: run.time,
            memory: 0
          };
        }

        return {
          success: run.exitCode === 0,
          status: run.exitCode === 0 ? 'ACCEPTED' : 'RUNTIME_ERROR',
          verdict: run.exitCode === 0 ? 'Accepted' : 'Runtime Error',
          stdout: run.stdout,
          stderr: run.stderr,
          compileOutput: '',
          time: run.time,
          memory: 0
        };
      }

      if (lang === 'python') {
        const srcFile = path.join(tmpDir, 'script.py');
        fs.writeFileSync(srcFile, sourceCode, 'utf-8');

        const run = await runProcess(this.pythonPath, ['-u', srcFile], { stdin, cwd: tmpDir, timeoutMs });
        if (run.isTimedOut) {
          return {
            success: false,
            status: 'TIME_LIMIT_EXCEEDED',
            verdict: 'Time Limit Exceeded',
            stdout: run.stdout,
            stderr: 'Time Limit Exceeded: Code execution exceeded maximum allowed time.',
            compileOutput: '',
            time: run.time,
            memory: 0
          };
        }

        return {
          success: run.exitCode === 0,
          status: run.exitCode === 0 ? 'ACCEPTED' : 'RUNTIME_ERROR',
          verdict: run.exitCode === 0 ? 'Accepted' : 'Runtime Error',
          stdout: run.stdout,
          stderr: run.stderr,
          compileOutput: '',
          time: run.time,
          memory: 0
        };
      }

      if (lang === 'javascript') {
        const srcFile = path.join(tmpDir, 'script.js');
        fs.writeFileSync(srcFile, sourceCode, 'utf-8');

        const run = await runProcess(this.nodePath, [srcFile], { stdin, cwd: tmpDir, timeoutMs });
        if (run.isTimedOut) {
          return {
            success: false,
            status: 'TIME_LIMIT_EXCEEDED',
            verdict: 'Time Limit Exceeded',
            stdout: run.stdout,
            stderr: 'Time Limit Exceeded: Code execution exceeded maximum allowed time.',
            compileOutput: '',
            time: run.time,
            memory: 0
          };
        }

        return {
          success: run.exitCode === 0,
          status: run.exitCode === 0 ? 'ACCEPTED' : 'RUNTIME_ERROR',
          verdict: run.exitCode === 0 ? 'Accepted' : 'Runtime Error',
          stdout: run.stdout,
          stderr: run.stderr,
          compileOutput: '',
          time: run.time,
          memory: 0
        };
      }

      if (lang === 'java') {
        const className = extractJavaClassName(sourceCode);
        const srcFile = path.join(tmpDir, `${className}.java`);
        fs.writeFileSync(srcFile, sourceCode, 'utf-8');

        const comp = await runProcess(this.javacPath, [srcFile], { cwd: tmpDir, timeoutMs: 10000 });
        if (comp.exitCode !== 0) {
          return {
            success: false,
            status: 'COMPILATION_ERROR',
            verdict: 'Compilation Error',
            stdout: '',
            stderr: comp.stderr,
            compileOutput: comp.stderr,
            time: comp.time,
            memory: 0
          };
        }

        const run = await runProcess(this.javaPath, ['-Xms32m', '-Xmx256m', className], { stdin, cwd: tmpDir, timeoutMs });
        if (run.isTimedOut) {
          return {
            success: false,
            status: 'TIME_LIMIT_EXCEEDED',
            verdict: 'Time Limit Exceeded',
            stdout: run.stdout,
            stderr: 'Time Limit Exceeded: Code execution exceeded maximum allowed time.',
            compileOutput: '',
            time: run.time,
            memory: 0
          };
        }

        return {
          success: run.exitCode === 0,
          status: run.exitCode === 0 ? 'ACCEPTED' : 'RUNTIME_ERROR',
          verdict: run.exitCode === 0 ? 'Accepted' : 'Runtime Error',
          stdout: run.stdout,
          stderr: run.stderr,
          compileOutput: '',
          time: run.time,
          memory: 0
        };
      }

      throw new Error(`Unsupported language for local runner: '${language}'`);
    } finally {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {}
    }
  }

  async executeTestCases({
    language,
    sourceCode,
    testCases = [],
    timeLimit = 5,
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

    const lang = this.normalizeLanguage(language);
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `muj_test_${nextId('loc')}_`));
    const cases = testCases.length ? testCases : [{ input: '', expectedOutput: '', marks: 1 }];
    const timeoutMs = Math.max(1000, Math.min(10000, (Number(timeLimit) || 5) * 1000));

    try {
      let runnerFn;

      // ─── Compile Phase (if compiled language) ─────────────────────────
      if (lang === 'c') {
        const srcFile = path.join(tmpDir, 'source.c');
        const exeFile = path.join(tmpDir, 'out.exe');
        fs.writeFileSync(srcFile, sourceCode, 'utf-8');

        const comp = await runProcess(this.gccPath, ['-O2', srcFile, '-o', exeFile], { cwd: tmpDir, timeoutMs: 10000 });
        if (comp.exitCode !== 0) {
          const compErr = comp.stderr || 'Compilation failed';
          return {
            passed: false,
            totalScore: 0,
            maxScore: cases.reduce((s, tc) => s + (tc.marks || 1), 0),
            compilationError: compErr,
            results: cases.map((tc, i) => ({
              input: isSubmit && tc.isHidden ? '[hidden]' : (tc.input || ''),
              expectedOutput: isSubmit && tc.isHidden ? '[hidden]' : (tc.expectedOutput || ''),
              actualOutput: '',
              passed: false,
              marks: tc.marks || 1,
              earnedMarks: 0,
              error: `Compilation Error: ${compErr}`,
              index: i
            }))
          };
        }

        runnerFn = (input) => runProcess(exeFile, [], { stdin: input, cwd: tmpDir, timeoutMs });
      } else if (lang === 'cpp') {
        const srcFile = path.join(tmpDir, 'source.cpp');
        const exeFile = path.join(tmpDir, 'out.exe');
        fs.writeFileSync(srcFile, sourceCode, 'utf-8');

        const comp = await runProcess(this.gppPath, ['-O2', srcFile, '-o', exeFile], { cwd: tmpDir, timeoutMs: 10000 });
        if (comp.exitCode !== 0) {
          const compErr = comp.stderr || 'Compilation failed';
          return {
            passed: false,
            totalScore: 0,
            maxScore: cases.reduce((s, tc) => s + (tc.marks || 1), 0),
            compilationError: compErr,
            results: cases.map((tc, i) => ({
              input: isSubmit && tc.isHidden ? '[hidden]' : (tc.input || ''),
              expectedOutput: isSubmit && tc.isHidden ? '[hidden]' : (tc.expectedOutput || ''),
              actualOutput: '',
              passed: false,
              marks: tc.marks || 1,
              earnedMarks: 0,
              error: `Compilation Error: ${compErr}`,
              index: i
            }))
          };
        }

        runnerFn = (input) => runProcess(exeFile, [], { stdin: input, cwd: tmpDir, timeoutMs });
      } else if (lang === 'python') {
        const srcFile = path.join(tmpDir, 'script.py');
        fs.writeFileSync(srcFile, sourceCode, 'utf-8');
        runnerFn = (input) => runProcess(this.pythonPath, ['-u', srcFile], { stdin: input, cwd: tmpDir, timeoutMs });
      } else if (lang === 'javascript') {
        const srcFile = path.join(tmpDir, 'script.js');
        fs.writeFileSync(srcFile, sourceCode, 'utf-8');
        runnerFn = (input) => runProcess(this.nodePath, [srcFile], { stdin: input, cwd: tmpDir, timeoutMs });
      } else if (lang === 'java') {
        const className = extractJavaClassName(sourceCode);
        const srcFile = path.join(tmpDir, `${className}.java`);
        fs.writeFileSync(srcFile, sourceCode, 'utf-8');

        const comp = await runProcess(this.javacPath, [srcFile], { cwd: tmpDir, timeoutMs: 10000 });
        if (comp.exitCode !== 0) {
          const compErr = comp.stderr || 'Compilation failed';
          return {
            passed: false,
            totalScore: 0,
            maxScore: cases.reduce((s, tc) => s + (tc.marks || 1), 0),
            compilationError: compErr,
            results: cases.map((tc, i) => ({
              input: isSubmit && tc.isHidden ? '[hidden]' : (tc.input || ''),
              expectedOutput: isSubmit && tc.isHidden ? '[hidden]' : (tc.expectedOutput || ''),
              actualOutput: '',
              passed: false,
              marks: tc.marks || 1,
              earnedMarks: 0,
              error: `Compilation Error: ${compErr}`,
              index: i
            }))
          };
        }

        runnerFn = (input) => runProcess(this.javaPath, ['-Xms32m', '-Xmx256m', className], { stdin: input, cwd: tmpDir, timeoutMs });
      } else {
        throw new Error(`Unsupported language for local runner: '${language}'`);
      }

      // ─── Test Case Evaluation Phase ───────────────────────────────────
      const results = [];
      for (let i = 0; i < cases.length; i++) {
        const tc = cases[i];
        const stdin = tc.input || '';
        const expectedOutput = tc.expectedOutput || tc.output || '';

        const run = await runnerFn(stdin);

        const normActual = normalizeOutput(run.stdout);
        const normExpected = normalizeOutput(expectedOutput);

        let passed = false;
        let error = null;

        if (run.isTimedOut) {
          error = 'Time Limit Exceeded';
        } else if (run.exitCode !== 0) {
          error = `Runtime Error: ${run.stderr.trim() || 'Process exited with non-zero code'}`;
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
          executionTime: `${Math.round(run.time * 1000)}ms`,
          memory: undefined,
          error,
          index: i
        });
      }

      return {
        passed: results.every(r => r.passed),
        totalScore: results.reduce((s, r) => s + r.earnedMarks, 0),
        maxScore: results.reduce((s, r) => s + r.marks, 0),
        compilationError: null,
        results
      };
    } finally {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {}
    }
  }

  async getSupportedLanguages() {
    return [
      { id: 'c', name: 'C (GCC 6.3.0)' },
      { id: 'cpp', name: 'C++ (G++ 6.3.0)' },
      { id: 'python', name: 'Python (3.10)' },
      { id: 'javascript', name: 'JavaScript (Node.js)' },
      { id: 'java', name: 'Java (JDK 26)' }
    ];
  }

  async checkHealth() {
    return {
      healthy: true,
      latencyMs: 1,
      mode: 'native-local',
      compilers: {
        gcc: true,
        gpp: true,
        python: true,
        node: true,
        java: true
      }
    };
  }
}
