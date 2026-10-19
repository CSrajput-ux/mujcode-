/**
 * MUJCODE Local Compiler — JavaScript Language Adapter (Language ID 63)
 * Reuses verified logic from compiler-engine/src/adapters/JavaScriptAdapter.js
 * 
 * Windows / Electron Safety:
 * Prevents invoking the Electron desktop binary as Node without the ELECTRON_RUN_AS_NODE flag.
 * Traps ENOENT and returns structured DEPENDENCY_MISSING.
 */

import fs from 'node:fs';
import path from 'node:path';
import { BaseAdapter, AdapterExecuteParams } from './BaseAdapter.js';
import { executeProcess } from '../runner.js';
import { ExecutionResult } from '../../shared/executionTypes.js';

export class JavaScriptAdapter extends BaseAdapter {
  async execute(params: AdapterExecuteParams): Promise<ExecutionResult> {
    const { requestId, sourceCode, stdin = '', timeLimitMs, runtimeExecutableOverride } = params;
    const workDir = this.createJobWorkspace();
    const sourceFile = path.join(workDir, 'script.js');

    // In Electron, process.execPath is the Electron GUI binary.
    // If runtimeExecutableOverride (e.g. system node.exe) is provided, use it.
    // Otherwise fallback to process.execPath with ELECTRON_RUN_AS_NODE=1.
    const isElectron = Boolean((process.versions as any).electron);
    const nodeCmd = runtimeExecutableOverride || (isElectron ? process.execPath : (process.env.NODE_PATH || process.execPath || 'node'));
    const extraEnv: Record<string, string> = (isElectron && !runtimeExecutableOverride) ? { ELECTRON_RUN_AS_NODE: '1' } : {};

    try {
      fs.writeFileSync(sourceFile, sourceCode, 'utf8');

      const timeout = Number(timeLimitMs || this.lang.defaultTimeLimitMs);
      const runRes = await executeProcess(
        nodeCmd,
        ['--max-old-space-size=128', sourceFile],
        {
          cwd: workDir,
          stdin,
          timeoutMs: timeout,
          env: extraEnv
        }
      );

      if (
        runRes.errorCode === 'ENOENT' ||
        runRes.errorCode === 'SPAWN_ERROR' ||
        runRes.stderr.includes('Executable not found')
      ) {
        return {
          requestId,
          status: 'DEPENDENCY_MISSING',
          verdict: 'Dependency Missing',
          stdout: '',
          stderr: `Node.js runtime was not found or could not be launched on your system (${nodeCmd}).\n\nInstallation instructions:\nPlease install Node.js via Winget: "winget install OpenJS.NodeJS.LTS" or download from https://nodejs.org/`,
          exitCode: 127,
          executionTimeMs: runRes.timeMs,
          truncated: false,
          language: this.lang.name,
          languageId: this.lang.id,
          missingTool: 'Node.js LTS Runtime',
          installInstruction: 'winget install OpenJS.NodeJS.LTS',
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
