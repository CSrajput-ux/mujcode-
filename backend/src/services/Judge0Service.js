import { config } from '../config.js';
import { logger } from '../lib/logger.js';

/**
 * Helper to encode UTF-8 text to Base64 safely in Node.js
 */
function toBase64(str) {
  if (str === null || str === undefined) return null;
  return Buffer.from(String(str), 'utf-8').toString('base64');
}

/**
 * Helper to decode Base64 back to UTF-8 text safely
 */
function fromBase64(str) {
  if (!str) return '';
  try {
    return Buffer.from(str, 'base64').toString('utf-8');
  } catch (err) {
    return String(str);
  }
}

/**
 * Judge0Service — Encapsulates all direct REST communication with the self-hosted Judge0 CE API.
 * The application interacts with Judge0 exclusively through this service.
 */
export class Judge0Service {
  /**
   * Internal HTTP request helper with timeout and optional auth headers
   */
  static async request(endpoint, options = {}) {
    const baseUrl = config.judge0Url.replace(/\/+$/, '');
    const url = `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (config.judge0AuthToken) {
      headers['X-Auth-Token'] = config.judge0AuthToken;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 10000);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeout);

      const responseText = await response.text();
      let data = null;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (err) {
        data = { raw: responseText };
      }

      if (!response.ok) {
        const errorMsg = data?.error || data?.message || `Judge0 responded with HTTP ${response.status}`;
        const error = new Error(errorMsg);
        error.status = response.status;
        error.details = data;
        throw error;
      }

      return data;
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        const timeoutError = new Error('Judge0 request timed out');
        timeoutError.code = 'ETIMEDOUT';
        throw timeoutError;
      }
      throw err;
    }
  }

  /**
   * Create an asynchronous code submission in Judge0.
   * Returns a submission token.
   */
  static async createSubmission({
    sourceCode,
    languageId,
    stdin = '',
    expectedOutput = null,
    cpuTimeLimit = null,
    memoryLimit = null,
    wallTimeLimit = null,
    callbackUrl = null
  }) {
    const payload = {
      source_code: toBase64(sourceCode),
      language_id: Number(languageId),
      stdin: stdin ? toBase64(stdin) : null,
      expected_output: expectedOutput !== null && expectedOutput !== undefined ? toBase64(expectedOutput) : null,
      cpu_time_limit: cpuTimeLimit ? Number(cpuTimeLimit) : config.judge0CpuTimeLimit,
      memory_limit: memoryLimit ? Number(memoryLimit) : config.judge0MemoryLimit,
      wall_time_limit: wallTimeLimit ? Number(wallTimeLimit) : config.judge0WallTimeLimit
    };

    if (callbackUrl) {
      payload.callback_url = callbackUrl;
    }

    // Use base64_encoded=true to preserve all whitespace, formatting, and unicode characters
    const query = '?base64_encoded=true&wait=false';
    const result = await this.request(`/submissions${query}`, {
      method: 'POST',
      body: JSON.stringify(payload),
      timeoutMs: 8000
    });

    if (!result?.token) {
      throw new Error('Judge0 failed to return a submission token');
    }

    return { token: result.token };
  }

  /**
   * Fetch a submission by token and decode all base64-encoded output fields.
   */
  static async getSubmission(token) {
    if (!token) throw new Error('Submission token is required');

    const fields = 'stdout,stderr,compile_output,message,status_id,status,time,memory,created_at,finished_at';
    const query = `?base64_encoded=true&fields=${fields}`;

    const raw = await this.request(`/submissions/${token}${query}`, {
      method: 'GET',
      timeoutMs: 5000
    });

    return {
      token,
      statusId: raw.status_id,
      statusDescription: raw.status?.description || 'Unknown',
      stdout: fromBase64(raw.stdout),
      stderr: fromBase64(raw.stderr),
      compileOutput: fromBase64(raw.compile_output),
      message: fromBase64(raw.message),
      time: raw.time !== null && raw.time !== undefined ? Number(raw.time) : null,
      memory: raw.memory !== null && raw.memory !== undefined ? Number(raw.memory) : null,
      createdAt: raw.created_at,
      finishedAt: raw.finished_at
    };
  }

  /**
   * Retrieve supported languages from Judge0
   */
  static async getLanguages() {
    return this.request('/languages', {
      method: 'GET',
      timeoutMs: 5000
    });
  }

  /**
   * Check if Judge0 API and workers are healthy
   */
  static async checkHealth() {
    const startTime = Date.now();
    try {
      const systemInfo = await this.request('/system_info', {
        method: 'GET',
        timeoutMs: 3000
      }).catch(async () => {
        // Fallback check if /system_info is not exposed
        return this.request('/languages', { method: 'GET', timeoutMs: 3000 });
      });

      return {
        healthy: true,
        latencyMs: Date.now() - startTime,
        systemInfo: typeof systemInfo === 'object' ? systemInfo : {}
      };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - startTime,
        error: err.message || 'Judge0 unreachable'
      };
    }
  }
}
