import { spawn } from 'node:child_process';
import { config } from '../config.js';

/**
 * Execute a process safely with resource limits, bounded output, and strict timeout.
 */
export async function executeProcess(executable, args = [], options = {}) {
  const {
    cwd,
    stdin = '',
    timeoutSec = config.defaultTimeLimitSec,
    maxOutputBytes = config.maxOutputBytes,
    env = {}
  } = options;

  return new Promise((resolve) => {
    const startTime = process.hrtime.bigint();
    const timeoutMs = Math.max(500, Math.min(config.maxTimeLimitSec * 1000, Number(timeoutSec) * 1000));

    let stdout = '';
    let stderr = '';
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let isOutputTruncated = false;
    let isTimedOut = false;
    let isFinished = false;

    // Filter environment to ensure no leaked parent secrets
    const cleanEnv = {
      PATH: process.env.PATH || '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
      HOME: cwd || '/tmp',
      LANG: 'en_US.UTF-8',
      LC_ALL: 'en_US.UTF-8',
      ...env
    };

    let child;
    try {
      child = spawn(executable, args, {
        cwd,
        env: cleanEnv,
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: process.platform !== 'win32' // allows killing entire process group on Linux
      });
    } catch (err) {
      return resolve({
        stdout: '',
        stderr: `Failed to spawn process (${executable}): ${err.message}`,
        exitCode: 1,
        timeMs: 0,
        isTimedOut: false,
        isOutputTruncated: false
      });
    }

    const timer = setTimeout(() => {
      if (isFinished) return;
      isTimedOut = true;
      try {
        if (process.platform !== 'win32' && child.pid) {
          process.kill(-child.pid, 'SIGTERM');
          setTimeout(() => {
            try { process.kill(-child.pid, 'SIGKILL'); } catch {}
          }, 400);
        } else {
          child.kill('SIGTERM');
          setTimeout(() => {
            try { child.kill('SIGKILL'); } catch {}
          }, 400);
        }
      } catch {}
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      if (stdoutBytes + chunk.length <= maxOutputBytes) {
        stdout += chunk.toString('utf8');
        stdoutBytes += chunk.length;
      } else if (!isOutputTruncated) {
        const remaining = maxOutputBytes - stdoutBytes;
        if (remaining > 0) {
          stdout += chunk.slice(0, remaining).toString('utf8');
        }
        stdout += '\n[Output truncated: Limit of 256 KB exceeded]';
        isOutputTruncated = true;
      }
    });

    child.stderr.on('data', (chunk) => {
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

    child.on('error', (err) => {
      if (isFinished) return;
      isFinished = true;
      clearTimeout(timer);
      const endTime = process.hrtime.bigint();
      const elapsedMs = Math.round(Number(endTime - startTime) / 1e6);
      resolve({
        stdout,
        stderr: stderr ? `${stderr}\n${err.message}` : err.message,
        exitCode: 1,
        timeMs: elapsedMs,
        isTimedOut: false,
        isOutputTruncated
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
        stderr,
        exitCode: isTimedOut ? 124 : (code ?? (signal ? 128 + 9 : 0)),
        timeMs: elapsedMs,
        isTimedOut,
        isOutputTruncated
      });
    });
  });
}
