/**
 * MUJCODE Local Compiler — Java Language Adapter (Language ID 62)
 * Reuses verified logic from compiler-engine/src/adapters/JavaAdapter.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { BaseAdapter, AdapterExecuteParams } from './BaseAdapter.js';
import { executeProcess } from '../runner.js';
import { ExecutionResult } from '../../shared/executionTypes.js';

function extractJavaClassName(sourceCode: string): string {
  const pubMatch = sourceCode.match(/public\s+class\s+([A-Za-z0-9_$]+)/);
  if (pubMatch) return pubMatch[1];
  const mainMatch = sourceCode.match(/class\s+([A-Za-z0-9_$]+)[^{]*\{[\s\S]*?public\s+static\s+void\s+main/);
  if (mainMatch) return mainMatch[1];
  const anyMatch = sourceCode.match(/class\s+([A-Za-z0-9_$]+)/);
  if (anyMatch) return anyMatch[1];
  return 'Main';
}

export class JavaAdapter extends BaseAdapter {
  async execute(params: AdapterExecuteParams): Promise<ExecutionResult> {
    const { requestId, sourceCode, stdin = '', timeLimitMs, runtimeExecutableOverride } = params;
    const workDir = this.createJobWorkspace();
    const className = extractJavaClassName(sourceCode);
    const sourceFile = path.join(workDir, `${className}.java`);

    const javacCmd = runtimeExecutableOverride || this.lang.compilerCommand || 'javac';
    const javaCmd = this.lang.runtimeExecutable || 'java';

    try {
      fs.writeFileSync(sourceFile, sourceCode, 'utf8');

      // 1. Compilation Phase
      const compRes = await executeProcess(
        javacCmd,
        ['-encoding', 'UTF-8', sourceFile],
        { cwd: workDir, timeoutMs: 10000 }
      );

      if (compRes.exitCode !== 0) {
        return {
          requestId,
          status: 'COMPILATION_ERROR',
          verdict: 'Compilation Error',
          stdout: '',
          stderr: compRes.stderr || compRes.stdout || 'Compilation failed',
          compileError: compRes.stderr || compRes.stdout || 'Compilation failed',
          exitCode: compRes.exitCode,
          executionTimeMs: compRes.timeMs,
          truncated: compRes.isOutputTruncated,
          language: this.lang.name,
          languageId: this.lang.id
        };
      }

      // 2. Execution Phase (with memory bounded JVM flags)
      const timeout = Number(timeLimitMs || this.lang.defaultTimeLimitMs);
      const runRes = await executeProcess(
        javaCmd,
        ['-Xms32m', '-Xmx256m', '-Dfile.encoding=UTF-8', className],
        { cwd: workDir, stdin, timeoutMs: timeout }
      );

      if (runRes.isTimedOut) {
        return {
          requestId,
          status: 'TIME_LIMIT_EXCEEDED',
          verdict: 'Time Limit Exceeded',
          stdout: runRes.stdout,
          stderr: 'Time Limit Exceeded: Process exceeded maximum execution time.',
          exitCode: 124,
          executionTimeMs: runRes.timeMs,
          truncated: runRes.isOutputTruncated,
          language: this.lang.name,
          languageId: this.lang.id
        };
      }

      const isSuccess = runRes.exitCode === 0;
      return {
        requestId,
        status: isSuccess ? 'SUCCESS' : 'RUNTIME_ERROR',
        verdict: isSuccess ? 'Accepted' : 'Runtime Error',
        stdout: runRes.stdout,
        stderr: runRes.stderr,
        exitCode: runRes.exitCode,
        executionTimeMs: runRes.timeMs,
        truncated: runRes.isOutputTruncated,
        language: this.lang.name,
        languageId: this.lang.id
      };
    } finally {
      this.cleanWorkspace(workDir);
    }
  }
}
