/**
 * MUJCODE Local Compiler — Base Language Adapter
 * Provides workspace directory lifecycle, isolation, and safe cleanup.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { LanguageDefinition, ExecutionResult } from '../../shared/executionTypes.js';

export interface AdapterExecuteParams {
  requestId: string;
  sourceCode: string;
  stdin?: string;
  timeLimitMs?: number;
  schemaSql?: string;
  seedSql?: string;
  rowLimit?: number;
  runtimeExecutableOverride?: string;
}

export abstract class BaseAdapter {
  protected lang: LanguageDefinition;
  protected workBaseDir: string;

  constructor(languageDef: LanguageDefinition) {
    this.lang = languageDef;
    this.workBaseDir = path.join(os.tmpdir(), 'mujbox');
  }

  /**
   * Create an isolated, disposable working directory for this execution job.
   */
  createJobWorkspace(): string {
    if (!fs.existsSync(this.workBaseDir)) {
      fs.mkdirSync(this.workBaseDir, { recursive: true });
    }
    const prefix = path.join(this.workBaseDir, `job_${Date.now()}_`);
    return fs.mkdtempSync(prefix);
  }

  /**
   * Clean up workspace directory with Windows file-lock retry tolerance.
   */
  cleanWorkspace(workDir: string): void {
    if (workDir && fs.existsSync(workDir)) {
      try {
        fs.rmSync(workDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
      } catch {
        // Fallback non-blocking cleanup if file locked by Windows Defender or lingering handle
        setTimeout(() => {
          try {
            if (fs.existsSync(workDir)) {
              fs.rmSync(workDir, { recursive: true, force: true });
            }
          } catch {}
        }, 1000).unref();
      }
    }
  }

  /**
   * Abstract execution entry point
   */
  abstract execute(params: AdapterExecuteParams): Promise<ExecutionResult>;
}
