/**
 * MUJCODE Local Compiler — C Language Adapter (Language ID 50)
 * Reuses verified logic from compiler-engine/src/adapters/CAdapter.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { BaseAdapter, AdapterExecuteParams } from './BaseAdapter.js';
import { executeProcess } from '../runner.js';
import { ExecutionResult } from '../../shared/executionTypes.js';

export class CAdapter extends BaseAdapter {
  async execute(params: AdapterExecuteParams): Promise<ExecutionResult> {
    const { requestId, sourceCode, stdin = '', timeLimitMs, runtimeExecutableOverride } = params;
    const workDir = this.createJobWorkspace();
    const sourceFile = path.join(workDir, 'source.c');
    const binExt = process.platform === 'win32' ? '.exe' : '.bin';
    const binaryFile = path.join(workDir, `out${binExt}`);
    const gccCmd = runtimeExecutableOverride || this.lang.compilerCommand || 'gcc';

    try {
      fs.writeFileSync(sourceFile, sourceCode, 'utf8');

      // 1. Compilation Phase
      const compRes = await executeProcess(
        gccCmd,
        ['-O2', sourceFile, '-o', binaryFile, '-lm'],
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

      // 2. Execution Phase
      const timeout = Number(timeLimitMs || this.lang.defaultTimeLimitMs);
      const runRes = await executeProcess(
        binaryFile,
        [],
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
