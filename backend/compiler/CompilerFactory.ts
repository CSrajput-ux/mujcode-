import { languageConfigs } from './LanguageConfigs.js';
import { RedisQueueExecutor } from './RedisQueueExecutor.js';

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

/** Extract the public class name from Java source code for correct filename. */
function getJavaClassName(code: string): string {
  const match = code.match(/public\s+class\s+(\w+)/);
  if (match) return match[1];
  const fallback = code.match(/\bclass\s+(\w+)/);
  return fallback ? fallback[1] : 'Main';
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

    if (!testCases || testCases.length === 0) {
      testCases = [{ input: '', expectedOutput: '' }];
    }

    try {
      const executor = new RedisQueueExecutor(
        language,
        code,
        testCases,
        config.timeLimitMs,
        config.memoryLimitMB,
        config
      );

      // In the real worker, we will evaluate verdicts. For this API Gateway mock,
      // we assume the worker returns an array of results for each test case.
      const results: any = await executor.executeAll();

      // Check if any test case failed
      const failedCase = results.find((r: any) => r.verdict !== 'Accepted' && r.verdict !== 'Successful');
      
      if (failedCase) {
        return {
          verdict: failedCase.verdict || 'Wrong Answer',
          output: failedCase.output || 'Test case failed.'
        };
      }

      return {
        verdict: mode === 'run' ? 'Successful' : 'Accepted',
        output: mode === 'run' ? 'Sample test cases executed successfully.' : 'All test cases passed.'
      };
    } catch (error: any) {
      console.error('[CompilerFactory] Execution error:', error);
      return { verdict: 'System Error', output: error.message || 'Internal error occurred' };
    }
  }
}
