/**
 * MUJCODE Local Compiler — Go Language Adapter (Language ID 60)
 * Hardened for Windows Go toolchain resolution and structured DEPENDENCY_MISSING handling.
 */

import fs from 'node:fs';
import path from 'node:path';
import { BaseAdapter, AdapterExecuteParams } from './BaseAdapter.js';
import { executeProcess } from '../runner.js';
import { ExecutionResult } from '../../shared/executionTypes.js';
import { runtimeDoctor } from '../../services/runtimeDoctor.js';

export class GoAdapter extends BaseAdapter {
  private resolveCompilerCommand(override?: string): string {
    if (override && fs.existsSync(override)) {
      return override;
    }
    const cached = runtimeDoctor.getResolvedPath('go');
    if (cached && fs.existsSync(cached)) {
      return cached;
    }
    if (process.env.GOROOT) {
      const gorootExe = path.join(process.env.GOROOT, 'bin', process.platform === 'win32' ? 'go.exe' : 'go');
      if (fs.existsSync(gorootExe)) return gorootExe;
    }
    return runtimeDoctor.findExecutableOnPath('go') || 'go';
  }

  async execute(params: AdapterExecuteParams): Promise<ExecutionResult> {
    const { requestId, sourceCode, stdin = '', timeLimitMs, runtimeExecutableOverride } = params;
    const workDir = this.createJobWorkspace();
    const sourceFile = path.join(workDir, 'main.go');
    const binExt = process.platform === 'win32' ? '.exe' : '.bin';
    const binaryFile = path.join(workDir, `out${binExt}`);
    const goCmd = this.resolveCompilerCommand(runtimeExecutableOverride);

    try {
      fs.writeFileSync(sourceFile, sourceCode, 'utf8');

      // Go build with GOCACHE & GOPATH in workDir to prevent permission/cache contamination
      const compRes = await executeProcess(
        goCmd,
        ['build', '-o', binaryFile, sourceFile],
        {
          cwd: workDir,
          timeoutMs: 10000,
          env: {
            GOCACHE: path.join(workDir, '.cache'),
            GOPATH: path.join(workDir, '.gopath')
          }
        }
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
          stderr: `Go compiler (go) was not found on your system (${goCmd}).\n\nInstallation instructions:\nPlease install Go via Winget: "winget install Golang.Go" or download from https://golang.org/dl/`,
          exitCode: 127,
          executionTimeMs: compRes.timeMs,
          truncated: false,
          language: this.lang.name,
          languageId: this.lang.id,
          missingTool: 'Go Compiler (Golang)',
          installInstruction: 'winget install Golang.Go',
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

      // Execution Phase
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
