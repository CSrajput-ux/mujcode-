/**
 * BaseExecutionProvider — Interface / abstract contract for code execution providers.
 * All providers (Judge0, SQL, etc.) implement this contract.
 */
export class BaseExecutionProvider {
  /**
   * @param {string} name - Identifier for the provider (e.g. 'judge0', 'sql')
   */
  constructor(name) {
    this.name = name;
  }

  /**
   * Execute single source code with optional stdin
   * @param {Object} params
   * @param {string} params.language - Language identifier
   * @param {string} params.sourceCode - Code to execute
   * @param {string} [params.stdin] - Standard input
   * @param {number} [params.timeLimit] - CPU time limit in seconds
   * @param {number} [params.memoryLimit] - Memory limit in KB
   * @returns {Promise<{success: boolean, status: string, verdict: string, stdout: string, stderr: string, compileOutput: string, time: number|null, memory: number|null}>}
   */
  async runCode(params) {
    throw new Error(`runCode() not implemented for provider '${this.name}'`);
  }

  /**
   * Execute source code against a batch of test cases
   * @param {Object} params
   * @param {string} params.language
   * @param {string} params.sourceCode
   * @param {Array<{input: string, expectedOutput: string, marks?: number, isHidden?: boolean}>} params.testCases
   * @param {number} [params.timeLimit]
   * @param {number} [params.memoryLimit]
   * @param {boolean} [params.isSubmit]
   * @returns {Promise<{passed: boolean, totalScore: number, maxScore: number, compilationError: string|null, results: Array}>}
   */
  async executeTestCases(params) {
    throw new Error(`executeTestCases() not implemented for provider '${this.name}'`);
  }

  /**
   * Get supported languages from this provider
   * @returns {Promise<Array<{id: number|string, name: string}>>}
   */
  async getSupportedLanguages() {
    throw new Error(`getSupportedLanguages() not implemented for provider '${this.name}'`);
  }

  /**
   * Health check for the provider
   * @returns {Promise<{healthy: boolean, latencyMs: number, details?: any, error?: string}>}
   */
  async checkHealth() {
    throw new Error(`checkHealth() not implemented for provider '${this.name}'`);
  }
}
