/**
 * MUJCODE Local Compiler — Unified Adapter Bridge
 * 
 * Provides a single, normalized entry point for executing code in all seven languages.
 * Validates inputs, coordinates with the Runtime Doctor, catches missing dependencies,
 * and normalizes verdicts.
 */

import { ExecutionRequest, ExecutionResult } from '../shared/executionTypes.js';
import { resolveLanguage } from './registry.js';
import { runtimeDoctor } from '../services/runtimeDoctor.js';
import { BaseAdapter } from './adapters/BaseAdapter.js';
import { CAdapter } from './adapters/CAdapter.js';
import { CppAdapter } from './adapters/CppAdapter.js';
import { JavaAdapter } from './adapters/JavaAdapter.js';
import { PythonAdapter } from './adapters/PythonAdapter.js';
import { JavaScriptAdapter } from './adapters/JavaScriptAdapter.js';
import { GoAdapter } from './adapters/GoAdapter.js';
import { SqlAdapter } from './adapters/SqlAdapter.js';

export class AdapterBridge {
  private adapterCache: Map<string, BaseAdapter> = new Map();

  private getAdapter(languageKey: string): BaseAdapter {
    const cached = this.adapterCache.get(languageKey);
    if (cached) return cached;

    const langDef = resolveLanguage(languageKey);
    let adapter: BaseAdapter;

    switch (langDef.key) {
      case 'c':
        adapter = new CAdapter(langDef);
        break;
      case 'cpp':
        adapter = new CppAdapter(langDef);
        break;
      case 'java':
        adapter = new JavaAdapter(langDef);
        break;
      case 'python':
        adapter = new PythonAdapter(langDef);
        break;
      case 'javascript':
        adapter = new JavaScriptAdapter(langDef);
        break;
      case 'go':
        adapter = new GoAdapter(langDef);
        break;
      case 'sql':
        adapter = new SqlAdapter(langDef);
        break;
      default:
        throw new Error(`No adapter implementation available for language: ${langDef.name}`);
    }

    this.adapterCache.set(languageKey, adapter);
    return adapter;
  }

  /**
   * Validate execution request payload.
   */
  private validateRequest(request: ExecutionRequest): void {
    if (!request) {
      throw new Error('Execution request payload is required');
    }
    if (!request.requestId || typeof request.requestId !== 'string') {
      throw new Error('requestId must be a valid non-empty string');
    }
    if (request.language === null || request.language === undefined) {
      throw new Error('language identifier is required');
    }
    if (typeof request.sourceCode !== 'string') {
      throw new Error('sourceCode must be a string');
    }
    if (Buffer.byteLength(request.sourceCode, 'utf8') > 100 * 1024) {
      throw new Error('Source code exceeds maximum allowed size of 100 KB');
    }
    if (request.stdin && Buffer.byteLength(request.stdin, 'utf8') > 1024 * 1024) {
      throw new Error('Standard input exceeds maximum allowed size of 1 MB');
    }
  }

  /**
   * Main execution entry point.
   */
  async executeCode(request: ExecutionRequest): Promise<ExecutionResult> {
    const startTime = Date.now();

    // 1. Basic validation
    try {
      this.validateRequest(request);
    } catch (err: any) {
      return {
        requestId: request?.requestId || 'unknown',
        status: 'INTERNAL_ERROR',
        verdict: 'Validation Error',
        stdout: '',
        stderr: err.message,
        exitCode: 1,
        executionTimeMs: 0,
        truncated: false,
        language: String(request?.language || 'unknown'),
        languageId: 0,
        errorCode: 'VALIDATION_FAILED'
      };
    }

    // 2. Resolve language
    let langDef;
    try {
      langDef = resolveLanguage(request.language);
    } catch (err: any) {
      return {
        requestId: request.requestId,
        status: 'INTERNAL_ERROR',
        verdict: 'Unsupported Language',
        stdout: '',
        stderr: err.message,
        exitCode: 1,
        executionTimeMs: 0,
        truncated: false,
        language: String(request.language),
        languageId: 0,
        errorCode: 'UNSUPPORTED_LANGUAGE'
      };
    }

    // 3. Source code emptiness check
    if (!request.sourceCode.trim()) {
      return {
        requestId: request.requestId,
        status: 'COMPILATION_ERROR',
        verdict: 'Compilation Error',
        stdout: '',
        stderr: 'Source code cannot be empty.',
        compileError: 'Source code cannot be empty.',
        exitCode: 1,
        executionTimeMs: 0,
        truncated: false,
        language: langDef.name,
        languageId: langDef.id
      };
    }

    // 4. Runtime Doctor Pre-Flight Check (Strict dependency verification)
    const diagnostic = await runtimeDoctor.getDiagnosticForLanguage(langDef.key);
    if (!diagnostic.available) {
      return {
        requestId: request.requestId,
        status: 'DEPENDENCY_MISSING',
        verdict: 'Dependency Missing',
        stdout: '',
        stderr: `Required runtime "${diagnostic.runtimeName}" is not installed or not found on your system PATH.\n\nInstallation instructions:\n${diagnostic.troubleshootingInstructions || 'Please install the required toolchain.'}`,
        exitCode: 127,
        executionTimeMs: Date.now() - startTime,
        truncated: false,
        language: langDef.name,
        languageId: langDef.id,
        missingTool: diagnostic.runtimeName,
        installInstruction: diagnostic.troubleshootingInstructions,
        errorCode: 'DEPENDENCY_MISSING'
      };
    }

    // 5. Delegate to appropriate language adapter
    try {
      const adapter = this.getAdapter(langDef.key);
      const resolvedExecutable = runtimeDoctor.getResolvedPath(langDef.key) || undefined;

      const result = await adapter.execute({
        requestId: request.requestId,
        sourceCode: request.sourceCode,
        stdin: request.stdin,
        timeLimitMs: request.timeLimitMs,
        schemaSql: request.schemaSql,
        seedSql: request.seedSql,
        rowLimit: request.rowLimit,
        runtimeExecutableOverride: resolvedExecutable
      });

      return result;
    } catch (err: any) {
      return {
        requestId: request.requestId,
        status: 'INTERNAL_ERROR',
        verdict: 'Internal Error',
        stdout: '',
        stderr: `Adapter execution error: ${err.message}`,
        exitCode: 1,
        executionTimeMs: Date.now() - startTime,
        truncated: false,
        language: langDef.name,
        languageId: langDef.id,
        errorCode: 'ADAPTER_ERROR'
      };
    }
  }
}

export const adapterBridge = new AdapterBridge();
