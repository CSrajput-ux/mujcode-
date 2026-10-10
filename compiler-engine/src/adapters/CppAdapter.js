import fs from 'node:fs';
import path from 'node:path';
import { BaseAdapter } from './BaseAdapter.js';
import { executeProcess } from '../sandbox/runner.js';
import { config } from '../config.js';

export class CppAdapter extends BaseAdapter {
  async execute({ sourceCode, stdin = '', timeLimit = null }) {
    const workDir = this.createJobWorkspace();
    const sourceFile = path.join(workDir, 'source.cpp');
    const binExt = process.platform === 'win32' ? '.exe' : '.bin';
    const binaryFile = path.join(workDir, `out${binExt}`);

    try {
      fs.writeFileSync(sourceFile, sourceCode, 'utf8');

      // Compilation Phase
      const compRes = await executeProcess(
        config.gppPath,
        ['-O2', sourceFile, '-o', binaryFile],
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

      // Execution Phase
      const timeoutSec = Number(timeLimit || this.lang.defaultTimeLimit);
      const runRes = await executeProcess(
        binaryFile,
        [],
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
