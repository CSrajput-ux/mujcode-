import { ExecutionResult } from './DockerExecutor.js';

export class VerdictEngine {
  public static evaluate(
    compileResult: ExecutionResult | null,
    runResult: ExecutionResult,
    expectedOutput: string
  ): { verdict: string; output: string } {
    if (compileResult && compileResult.exitCode !== 0) {
      return { verdict: 'Compilation Error', output: compileResult.stderr || compileResult.stdout };
    }

    if (runResult.isTimeout) {
      return { verdict: 'Time Limit Exceeded', output: 'Execution timed out.' };
    }

    if (runResult.exitCode !== 0) {
      // Could be Runtime Error or Memory Limit Exceeded depending on exit code (e.g. 137 for OOM)
      if (runResult.exitCode === 137) {
        return { verdict: 'Memory Limit Exceeded', output: 'Process was killed due to memory limits.' };
      }
      return { verdict: 'Runtime Error', output: runResult.stderr || runResult.stdout };
    }

    const normActual = runResult.stdout
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(line => line.trimEnd())
      .join('\n')
      .trim();
    const normExpected = (expectedOutput || '')
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(line => line.trimEnd())
      .join('\n')
      .trim();

    if (!normExpected || normExpected === 'ANY' || normActual === normExpected) {
      return { verdict: 'Accepted', output: normActual || 'All test cases passed!' };
    } else {
      return { verdict: 'Wrong Answer', output: normActual };
    }
  }
}
