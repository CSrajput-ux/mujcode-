/**
 * MUJCODE Local Compiler — Python Language Adapter (Language ID 71)
 * Hardened for Windows executable resolution, py launcher fallback,
 * and structured DEPENDENCY_MISSING error handling.
 */

import fs from 'node:fs';
import path from 'node:path';
import { BaseAdapter, AdapterExecuteParams } from './BaseAdapter.js';
import { executeProcess } from '../runner.js';
import { ExecutionResult, LanguageDefinition } from '../../shared/executionTypes.js';
import { runtimeDoctor } from '../../services/runtimeDoctor.js';

export class PythonAdapter extends BaseAdapter {
  constructor(languageDef?: LanguageDefinition) {
    super(
      languageDef || {
        id: 71,
        key: 'python',
        name: 'Python (Python 3)',
        aliases: ['python', 'python3', 'py', 'py3', '71'],
        extension: '.py',
        isCompiled: false,
        supportsStdin: true,
        defaultTimeLimitMs: 3000,
        maxTimeLimitMs: 10000,
        defaultMemoryLimitMb: 256,
        runtimeExecutable: 'python'
      }
    );
  }

  private resolvePythonCommand(override?: string): string {
    if (override) {
      return override;
    }

    // Check cached path in runtime doctor
    const cached = runtimeDoctor.getResolvedPath('python');
    if (cached && fs.existsSync(cached)) {
      return cached;
    }

    // Check known paths on Windows
    if (process.platform === 'win32') {
      const resolved = runtimeDoctor.findExecutableOnPath('python') ||
        runtimeDoctor.findExecutableOnPath('py') ||
        runtimeDoctor.findExecutableOnPath('python3');
      if (resolved) return resolved;

      // Check py launcher in Windows
      if (fs.existsSync('C:\\Windows\\py.exe')) {
        return 'C:\\Windows\\py.exe';
      }

      return 'python';
    }

    return runtimeDoctor.findExecutableOnPath('python3') || 'python3';
  }

  async execute(params: AdapterExecuteParams): Promise<ExecutionResult> {
    const { requestId, sourceCode, stdin = '', timeLimitMs, runtimeExecutableOverride } = params;
    const workDir = this.createJobWorkspace();
    const sourceFile = path.join(workDir, 'script.py');
    const pythonCmd = this.resolvePythonCommand(runtimeExecutableOverride);

    try {
      fs.writeFileSync(sourceFile, sourceCode, 'utf8');

      const timeout = Number(timeLimitMs || this.lang.defaultTimeLimitMs);
      const isPyLauncher = pythonCmd.toLowerCase().endsWith('py.exe') || pythonCmd.toLowerCase() === 'py';
      const runArgs = isPyLauncher ? ['-3', '-u', sourceFile] : ['-u', sourceFile];

      const runRes = await executeProcess(
        pythonCmd,
        runArgs,
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

      // Trapping spawn ENOENT / missing executable
      if (
        runRes.errorCode === 'ENOENT' ||
        runRes.errorCode === 'SPAWN_ERROR' ||
        runRes.stderr.includes('Executable not found') ||
        runRes.stderr.includes('spawn python ENOENT') ||
        runRes.stderr.includes('No such file or directory')
      ) {
        return {
          requestId,
          status: 'DEPENDENCY_MISSING',
          verdict: 'Dependency Missing',
          stdout: '',
          stderr: `Python 3 runtime was not found or could not be launched on your system (${pythonCmd}).\n\nInstallation instructions:\nPlease install Python via Winget: "winget install Python.Python.3.12" or download from https://www.python.org/downloads/`,
          exitCode: 127,
          executionTimeMs: runRes.timeMs,
          truncated: false,
          language: this.lang.name,
          languageId: this.lang.id,
          missingTool: 'Python 3 Runtime',
          installInstruction: 'winget install Python.Python.3.12',
          errorCode: 'RUNTIME_NOT_FOUND'
        };
      }

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
