import { languageConfigs } from './LanguageConfigs.js';
import { WorkspaceManager } from './WorkspaceManager.js';
import { DockerExecutor, ExecutionResult } from './DockerExecutor.js';
import { VerdictEngine } from './VerdictEngine.js';

export interface TestCase {
  input: string;
  expectedOutput?: string;
  output?: string;
  marks?: number;
}

export interface JudgeResult {
  verdict: string;
  output: string;
}

export class CompilerFactory {
  static async execute(
    code: string,
    language: string,
    testCases: TestCase[],
    mode: 'run' | 'submit'
  ): Promise<JudgeResult> {
    const config = languageConfigs[language.toLowerCase()];
    if (!config) {
      return { verdict: 'System Error', output: `Unsupported language: ${language}` };
    }

    const workspace = new WorkspaceManager();
    try {
      await workspace.initWorkspace();
      await workspace.writeCode(code, config.extension);

      const executor = new DockerExecutor(
        config.imageName,
        workspace.workspacePath,
        config.timeLimitMs,
        config.memoryLimitMB
      );

      let compileResult: ExecutionResult | null = null;

      // Compile step if required
      if (config.compileCmd) {
        compileResult = await executor.compile(config.compileCmd);
        if (compileResult.exitCode !== 0) {
          return { verdict: 'Compilation Error', output: compileResult.stderr || compileResult.stdout };
        }
      }

      // If no test cases are provided, create a dummy one for simple testing
      if (!testCases || testCases.length === 0) {
        testCases = [{ input: '', expectedOutput: 'ok' }];
      }

      // Run step for each test case
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        await workspace.writeInput(testCase.input || '');

        const runResult = await executor.run(config.runCmd);

        // Normalize expected output from DB
        const expected = testCase.expectedOutput || testCase.output || '';
        const evaluated = VerdictEngine.evaluate(compileResult, runResult, expected);

        if (evaluated.verdict !== 'Accepted') {
          return {
            verdict: evaluated.verdict,
            output: `Test case ${i + 1} failed.\nOutput:\n${evaluated.output}`
          };
        }
      }

      return {
        verdict: mode === 'run' ? 'Successful' : 'Accepted',
        output: mode === 'run'
          ? 'Sample test cases passed.'
          : 'All hidden and sample test cases passed.'
      };

    } catch (error: any) {
      console.error('Execution error:', error);
      return { verdict: 'System Error', output: error.message || 'Internal error occurred' };
    } finally {
      await workspace.cleanup();
    }
  }
}
