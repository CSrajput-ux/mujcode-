/**
 * MUJCODE Local Compiler — C Language Adapter (Language ID 50)
 * Hardened for Windows executable resolution and structured DEPENDENCY_MISSING handling.
 */

import fs from 'node:fs';
import path from 'node:path';
import { BaseAdapter, AdapterExecuteParams } from './BaseAdapter.js';
import { executeProcess } from '../runner.js';
import { ExecutionResult } from '../../shared/executionTypes.js';
import { runtimeDoctor } from '../../services/runtimeDoctor.js';

export class CAdapter extends BaseAdapter {
  private resolveCompilerCommand(override?: string): string {
    if (override && fs.existsSync(override)) {
      return override;
    }
    const cached = runtimeDoctor.getResolvedPath('c');
    if (cached && fs.existsSync(cached)) {
      return cached;
    }
    return runtimeDoctor.findExecutableOnPath('gcc') || 'gcc';
  }

  async execute(params: AdapterExecuteParams): Promise<ExecutionResult> {
    const { requestId, sourceCode, stdin = '', timeLimitMs, runtimeExecutableOverride } = params;
    const workDir = this.createJobWorkspace();
    const sourceFile = path.join(workDir, 'source.c');
    const binExt = process.platform === 'win32' ? '.exe' : '.bin';
    const binaryFile = path.join(workDir, `out${binExt}`);
    const gccCmd = this.resolveCompilerCommand(runtimeExecutableOverride);

    try {
      fs.writeFileSync(sourceFile, sourceCode, 'utf8');

      // 1. Compilation Phase
      const compRes = await executeProcess(
        gccCmd,
        ['-O2', sourceFile, '-o', binaryFile, '-lm'],
        { cwd: workDir, timeoutMs: 10000 }
      );

      if (
        compRes.errorCode === 'ENOENT' ||
        compRes.errorCode === 'SPAWN_ERROR' ||
        compRes.stderr.includes('Executable not found')
      ) {
        return {
          requestId,
          status: 'DEPENDENCY_MISSING',
          verdict: 'Dependency Missing',
          stdout: '',
          stderr: `GCC C compiler was not found on your system (${gccCmd}).\n\nInstallation instructions:\nPlease install MinGW-w64 via Winget: "winget install MSYS2.MSYS2" or download from winlibs.com`,
          exitCode: 127,
          executionTimeMs: compRes.timeMs,
          truncated: false,
          language: this.lang.name,
          languageId: this.lang.id,
          missingTool: 'GCC (C Compiler)',
          installInstruction: 'winget install MSYS2.MSYS2',
          errorCode: 'RUNTIME_NOT_FOUND'
        };
      }

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
