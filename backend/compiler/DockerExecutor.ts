import { exec } from 'child_process';
import util from 'util';
import crypto from 'crypto';

const execAsync = util.promisify(exec);

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timeMs: number;
  memoryMB?: number;
  isTimeout: boolean;
}

export class DockerExecutor {
  constructor(
    private imageName: string,
    private workspacePath: string,
    private timeLimitMs: number,
    private memoryLimitMB: number
  ) {}

  async compile(compileCmd: string): Promise<ExecutionResult> {
    const containerName = `compile_${crypto.randomUUID()}`;
    const cmd = `docker run --rm --name ${containerName} --network none -v "${this.workspacePath}":/workspace -w /workspace ${this.imageName} sh -c "${compileCmd}"`;
    return this.executeDockerCommand(cmd, containerName, 10000); // 10 sec compile limit
  }

  async run(runCmd: string): Promise<ExecutionResult> {
    const containerName = `run_${crypto.randomUUID()}`;
    const timeoutSecs = Math.ceil(this.timeLimitMs / 1000);
    // Use timeout inside the container for accurate execution time limit
    const cmd = `docker run --rm --name ${containerName} --network none --memory ${this.memoryLimitMB}m --cpus 1 --pids-limit 64 -v "${this.workspacePath}":/workspace:ro -w /workspace ${this.imageName} sh -c "timeout ${timeoutSecs} ${runCmd} < input.txt"`;
    
    // Give Docker 10 seconds to spin up and tear down on the host machine
    return this.executeDockerCommand(cmd, containerName, 15000, this.timeLimitMs);
  }

  private async executeDockerCommand(cmd: string, containerName: string, hostTimeoutMs: number, execTimeLimitMs?: number): Promise<ExecutionResult> {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let exitCode = 0;
    let isTimeout = false;

    try {
      const { stdout: out, stderr: err } = await execAsync(cmd, { timeout: hostTimeoutMs, killSignal: 'SIGTERM' });
      stdout = out;
      stderr = err;
    } catch (error: any) {
      stdout = error.stdout || '';
      stderr = typeof error.stderr === 'string' ? error.stderr : (error.message || '');
      exitCode = error.code !== undefined ? error.code : 1;
      
      if (error.killed && error.signal === 'SIGTERM') {
        isTimeout = true;
        // Clean up the runaway container
        await execAsync(`docker rm -f ${containerName}`).catch(() => {});
      } else if (exitCode === 124) {
        // Exit code 124 means the `timeout` command inside the container killed the process
        isTimeout = true;
      }
    }

    const timeMs = Date.now() - startTime;
    
    // We should also simulate time out if the time exceeds execution time limit 
    if (execTimeLimitMs && timeMs > (execTimeLimitMs + 5000)) {
      // Just a fallback heuristic
      isTimeout = true;
    }

    return {
      stdout,
      stderr,
      exitCode,
      timeMs,
      isTimeout,
    };
  }
}
