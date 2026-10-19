/**
 * MUJCODE Local Compiler — Python Language Adapter (Language ID 71)
 * Reuses verified logic from compiler-engine/src/adapters/PythonAdapter.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { BaseAdapter, AdapterExecuteParams } from './BaseAdapter.js';
import { executeProcess } from '../runner.js';
import { ExecutionResult } from '../../shared/executionTypes.js';

export class PythonAdapter extends BaseAdapter {
  async execute(params: AdapterExecuteParams): Promise<ExecutionResult> {
    const { requestId, sourceCode, stdin = '', timeLimitMs, runtimeExecutableOverride } = params;
    const workDir = this.createJobWorkspace();
    const sourceFile = path.join(workDir, 'script.py');
    const pythonCmd = runtimeExecutableOverride || (process.platform === 'win32' ? 'python' : 'python3');

    try {
      fs.writeFileSync(sourceFile, sourceCode, 'utf8');

      const timeout = Number(timeLimitMs || this.lang.defaultTimeLimitMs);
      const runRes = await executeProcess(
        pythonCmd,
        ['-u', sourceFile],
        {
          cwd: workDir,
          stdin,
          timeoutMs: timeout,
          env: {
            PYTHONUTF8: '1',
            PYTHONIOENCODING: 'utf-8'
          }
        }
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
