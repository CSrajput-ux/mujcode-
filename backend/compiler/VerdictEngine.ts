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

    const actual = runResult.stdout.trim();
    const expected = expectedOutput.trim();

    // In a real scenario, this might need more robust comparing, e.g., ignoring trailing spaces per line
    if (actual === expected) {
      return { verdict: 'Accepted', output: actual };
    } else {
      return { verdict: 'Wrong Answer', output: actual };
    }
  }
}
