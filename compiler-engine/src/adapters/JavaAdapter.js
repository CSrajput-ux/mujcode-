import fs from 'node:fs';
import path from 'node:path';
import { BaseAdapter } from './BaseAdapter.js';
import { executeProcess } from '../sandbox/runner.js';
import { config } from '../config.js';

function extractJavaClassName(sourceCode) {
  const pubMatch = sourceCode.match(/public\s+class\s+([A-Za-z0-9_$]+)/);
  if (pubMatch) return pubMatch[1];
  const mainMatch = sourceCode.match(/class\s+([A-Za-z0-9_$]+)[^{]*\{[\s\S]*?public\s+static\s+void\s+main/);
  if (mainMatch) return mainMatch[1];
  const anyMatch = sourceCode.match(/class\s+([A-Za-z0-9_$]+)/);
  if (anyMatch) return anyMatch[1];
  return 'Main';
}

export class JavaAdapter extends BaseAdapter {
  async execute({ sourceCode, stdin = '', timeLimit = null }) {
    const workDir = this.createJobWorkspace();
    const className = extractJavaClassName(sourceCode);
    const sourceFile = path.join(workDir, `${className}.java`);

    try {
      fs.writeFileSync(sourceFile, sourceCode, 'utf8');

      // Compilation Phase
      const compRes = await executeProcess(
        config.javacPath,
        ['-encoding', 'UTF-8', sourceFile],
        { cwd: workDir, timeoutSec: 10 }
      );

      if (compRes.exitCode !== 0) {
        return {
          status: 'COMPILATION_ERROR',
          statusId: 6,
          verdict: 'Compilation Error',
          compileOutput: compRes.stderr || compRes.stdout || 'Compilation failed',
          stdout: '',
          stderr: compRes.stderr,
          exitCode: compRes.exitCode,
          timeMs: compRes.timeMs,
          memoryKb: null
        };
      }

      // Execution Phase with optimized, lightweight JVM heap bounds
      const timeoutSec = Number(timeLimit || this.lang.defaultTimeLimit);
      const runRes = await executeProcess(
        config.javaPath,
        ['-Xms32m', '-Xmx256m', '-Dfile.encoding=UTF-8', className],
        { cwd: workDir, stdin, timeoutSec }
      );

      if (runRes.isTimedOut) {
        return {
          status: 'TIME_LIMIT_EXCEEDED',
          statusId: 5,
          verdict: 'Time Limit Exceeded',
          compileOutput: '',
          stdout: runRes.stdout,
          stderr: 'Time Limit Exceeded: Process exceeded maximum execution time.',
          exitCode: 124,
          timeMs: runRes.timeMs,
          memoryKb: null
        };
      }

      const isSuccess = runRes.exitCode === 0;
      return {
        status: isSuccess ? 'ACCEPTED' : 'RUNTIME_ERROR',
        statusId: isSuccess ? 3 : 11,
        verdict: isSuccess ? 'Accepted' : 'Runtime Error',
        compileOutput: '',
        stdout: runRes.stdout,
        stderr: runRes.stderr,
        exitCode: runRes.exitCode,
        timeMs: runRes.timeMs,
        memoryKb: null
      };
    } finally {
      this.cleanWorkspace(workDir);
    }
  }
}
