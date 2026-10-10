import fs from 'node:fs';
import path from 'node:path';
import { BaseAdapter } from './BaseAdapter.js';
import { executeProcess } from '../sandbox/runner.js';
import { config } from '../config.js';

export class PythonAdapter extends BaseAdapter {
  async execute({ sourceCode, stdin = '', timeLimit = null }) {
    const workDir = this.createJobWorkspace();
    const sourceFile = path.join(workDir, 'script.py');

    try {
      fs.writeFileSync(sourceFile, sourceCode, 'utf8');

      const timeoutSec = Number(timeLimit || this.lang.defaultTimeLimit);
      const runRes = await executeProcess(
        config.pythonPath,
        ['-u', sourceFile],
        {
          cwd: workDir,
          stdin,
          timeoutSec,
          env: {
            PYTHONUTF8: '1',
            PYTHONIOENCODING: 'utf-8'
          }
        }
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
