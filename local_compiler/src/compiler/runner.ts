/**
 * MUJCODE Local Compiler — Windows-Hardened Process Runner
 * 
 * Executes processes with:
 * - Direct vector spawning (shell: false)
 * - Safe environment variable sanitization
 * - Strict timeout enforcement
 * - Process tree termination on Windows (taskkill /PID <pid> /T /F)
 * - Output buffer capping (256 KB)
 * - Graceful ENOENT / missing executable trapping
 * 
 * NOTE ON SECURITY LIMITATIONS:
 * Process spawning under Node.js does NOT constitute an operating-system level sandbox.
 * Child processes inherit the privileges of the active Windows user account.
 * This execution runner is intended for the student's personal development environment.
 */

import { spawn, ChildProcess } from 'node:child_process';

export interface ProcessRunOptions {
  cwd?: string;
  stdin?: string;
  timeoutMs?: number;
  maxOutputBytes?: number;
  env?: Record<string, string>;
}

export interface ProcessRunResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timeMs: number;
  isTimedOut: boolean;
  isOutputTruncated: boolean;
  errorCode?: string;
}

/**
 * Kill a process and its entire child process tree on Windows.
 */
export function killProcessTree(pid: number | undefined): void {
  if (!pid) return;

  if (process.platform === 'win32') {
    try {
      // Force kill the process and all child processes spawned by it (/T = tree, /F = forcefully)
      const killer = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], {
        windowsHide: true,
        stdio: 'ignore'
      });
      killer.unref();
    } catch {
      // Fallback to standard process kill
      try {
        process.kill(pid, 'SIGKILL');
      } catch {}
    }
  } else {
    try {
      process.kill(-pid, 'SIGKILL');
    } catch {
      try {
        process.kill(pid, 'SIGKILL');
      } catch {}
    }
  }
}

export async function executeProcess(
  executable: string,
  args: string[] = [],
  options: ProcessRunOptions = {}
): Promise<ProcessRunResult> {
  const {
    cwd,
    stdin = '',
    timeoutMs = 3000,
    maxOutputBytes = 256 * 1024,
    env = {}
  } = options;

  return new Promise((resolve) => {
    const startTime = process.hrtime.bigint();
    const effectiveTimeoutMs = Math.max(500, Math.min(15000, Number(timeoutMs) || 3000));

    let stdout = '';
    let stderr = '';
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let isOutputTruncated = false;
    let isTimedOut = false;
    let isFinished = false;

    // Sanitize environment: pass system PATH, system drive, and temp locations
    const cleanEnv: NodeJS.ProcessEnv = {
      PATH: process.env.PATH || '',
      SystemRoot: process.env.SystemRoot || 'C:\\Windows',
      TEMP: process.env.TEMP || cwd || '',
      TMP: process.env.TMP || cwd || '',
      USERPROFILE: process.env.USERPROFILE || '',
      LANG: 'en_US.UTF-8',
      ...env
    };

    let child: ChildProcess;
    try {
      child = spawn(executable, args, {
        cwd,
        env: cleanEnv,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false,
        windowsHide: true,
        detached: process.platform !== 'win32'
      });
    } catch (err: any) {
      return resolve({
        stdout: '',
        stderr: `Failed to spawn process (${executable}): ${err.message}`,
        exitCode: 1,
        timeMs: 0,
        isTimedOut: false,
        isOutputTruncated: false,
        errorCode: err.code || 'SPAWN_ERROR'
      });
    }

    const timer = setTimeout(() => {
      if (isFinished) return;
      isTimedOut = true;
      killProcessTree(child.pid);
    }, effectiveTimeoutMs);

    child.stdout?.on('data', (chunk: Buffer) => {
      if (stdoutBytes + chunk.length <= maxOutputBytes) {
        stdout += chunk.toString('utf8');
        stdoutBytes += chunk.length;
      } else if (!isOutputTruncated) {
        const remaining = maxOutputBytes - stdoutBytes;
        if (remaining > 0) {
          stdout += chunk.subarray(0, remaining).toString('utf8');
        }
        stdout += '\n[Output truncated: Limit of 256 KB exceeded]';
        isOutputTruncated = true;
      }
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      if (stderrBytes + chunk.length <= maxOutputBytes) {
        stderr += chunk.toString('utf8');
        stderrBytes += chunk.length;
      } else {
        stderr += '\n[Stderr truncated]';
      }
    });

    if (stdin && child.stdin) {
      try {
        child.stdin.write(stdin);
        child.stdin.end();
      } catch {}
    } else if (child.stdin) {
      child.stdin.end();
    }

    child.on('error', (err: any) => {
      if (isFinished) return;
      isFinished = true;
      clearTimeout(timer);
      const endTime = process.hrtime.bigint();
      const elapsedMs = Math.round(Number(endTime - startTime) / 1e6);

      const isNotFound = err.code === 'ENOENT';
      const errorMessage = isNotFound
        ? `Executable not found: "${executable}". Please ensure it is installed and added to your system PATH.`
        : `Execution error: ${err.message}`;

      resolve({
        stdout,
        stderr: stderr ? `${stderr}\n${errorMessage}` : errorMessage,
        exitCode: 1,
        timeMs: elapsedMs,
        isTimedOut: false,
        isOutputTruncated,
        errorCode: err.code || 'PROCESS_ERROR'
      });
    });

    child.on('close', (code, signal) => {
      if (isFinished) return;
      isFinished = true;
      clearTimeout(timer);
      const endTime = process.hrtime.bigint();
      const elapsedMs = Math.round(Number(endTime - startTime) / 1e6);

      resolve({
        stdout,
        stderr: isTimedOut ? 'Time Limit Exceeded: Process exceeded maximum execution time.' : stderr,
        exitCode: isTimedOut ? 124 : (code ?? (signal ? 137 : 0)),
        timeMs: elapsedMs,
        isTimedOut,
        isOutputTruncated,
        errorCode: isTimedOut ? 'TIME_LIMIT_EXCEEDED' : undefined
      });
    });
  });
}
