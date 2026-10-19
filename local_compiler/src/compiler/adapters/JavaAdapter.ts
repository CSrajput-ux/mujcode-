/**
 * MUJCODE Local Compiler — Java Language Adapter (Language ID 62)
 * Hardened for Windows JDK resolution and structured DEPENDENCY_MISSING handling.
 */

import fs from 'node:fs';
import path from 'node:path';
import { BaseAdapter, AdapterExecuteParams } from './BaseAdapter.js';
import { executeProcess } from '../runner.js';
import { ExecutionResult } from '../../shared/executionTypes.js';
import { runtimeDoctor } from '../../services/runtimeDoctor.js';

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
  private resolveCommands(override?: string): { javacCmd: string; javaCmd: string } {
    let javacCmd = override && fs.existsSync(override) ? override : (runtimeDoctor.getResolvedPath('java') || runtimeDoctor.findExecutableOnPath('javac') || 'javac');
    let javaCmd = runtimeDoctor.findExecutableOnPath('java') || 'java';

    if (process.env.JAVA_HOME) {
      const homeJavac = path.join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'javac.exe' : 'javac');
      const homeJava = path.join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
      if (fs.existsSync(homeJavac)) javacCmd = homeJavac;
      if (fs.existsSync(homeJava)) javaCmd = homeJava;
    }

    return { javacCmd, javaCmd };
  }

  async execute(params: AdapterExecuteParams): Promise<ExecutionResult> {
    const { requestId, sourceCode, stdin = '', timeLimitMs, runtimeExecutableOverride } = params;
    const workDir = this.createJobWorkspace();
    const className = extractJavaClassName(sourceCode);
    const sourceFile = path.join(workDir, `${className}.java`);

    const { javacCmd, javaCmd } = this.resolveCommands(runtimeExecutableOverride);

    try {
      fs.writeFileSync(sourceFile, sourceCode, 'utf8');

      // 1. Compilation Phase
      const compRes = await executeProcess(
        javacCmd,
        ['-encoding', 'UTF-8', sourceFile],
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
          stderr: `Java Development Kit compiler (javac) was not found on your system (${javacCmd}).\n\nInstallation instructions:\nPlease install OpenJDK via Winget: "winget install EclipseAdoptium.Temurin.21.JDK"`,
          exitCode: 127,
          executionTimeMs: compRes.timeMs,
          truncated: false,
          language: this.lang.name,
          languageId: this.lang.id,
          missingTool: 'Java Development Kit (JDK)',
          installInstruction: 'winget install EclipseAdoptium.Temurin.21.JDK',
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

      // 2. Execution Phase (with memory bounded JVM flags)
      const timeout = Number(timeLimitMs || this.lang.defaultTimeLimitMs);
      const runRes = await executeProcess(
        javaCmd,
        ['-Xms32m', '-Xmx256m', '-Dfile.encoding=UTF-8', className],
        { cwd: workDir, stdin, timeoutMs: timeout }
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
          stderr: `Java Runtime Environment (java) was not found on your system (${javaCmd}).`,
          exitCode: 127,
          executionTimeMs: runRes.timeMs,
          truncated: false,
          language: this.lang.name,
          languageId: this.lang.id,
          missingTool: 'Java Runtime Environment (JRE)',
          installInstruction: 'winget install EclipseAdoptium.Temurin.21.JDK',
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
