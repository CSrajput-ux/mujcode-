import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

export class BaseAdapter {
  constructor(languageDef) {
    this.lang = languageDef;
  }

  createJobWorkspace() {
    if (!fs.existsSync(config.workBaseDir)) {
      fs.mkdirSync(config.workBaseDir, { recursive: true });
    }
    const prefix = path.join(config.workBaseDir, `job_${Date.now()}_`);
    return fs.mkdtempSync(prefix);
  }

  cleanWorkspace(workDir) {
    if (workDir && fs.existsSync(workDir)) {
      try {
        fs.rmSync(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
      } catch {}
    }
  }

  /**
   * Abstract execute method to be implemented by language adapters
   */
  async execute({ sourceCode, stdin = '', timeLimit = null, memoryLimit = null }) {
    throw new Error('execute() must be implemented by adapter');
  }
}
