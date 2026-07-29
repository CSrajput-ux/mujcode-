import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

export class WorkspaceManager {
  public workspacePath: string;

  constructor() {
    const id = crypto.randomUUID();
    this.workspacePath = path.join(os.tmpdir(), `mujcode_workspace_${id}`);
  }

  async initWorkspace(): Promise<void> {
    await fs.mkdir(this.workspacePath, { recursive: true });
    // Make sure all users can read/write to the temp directory so Docker non-root user can access
    await fs.chmod(this.workspacePath, 0o777);
  }

  async writeCode(code: string, extension: string): Promise<string> {
    const filePath = path.join(this.workspacePath, `code.${extension}`);
    await fs.writeFile(filePath, code);
    await fs.chmod(filePath, 0o666);
    return filePath;
  }

  async writeInput(input: string): Promise<string> {
    const filePath = path.join(this.workspacePath, 'input.txt');
    await fs.writeFile(filePath, input);
    await fs.chmod(filePath, 0o666);
    return filePath;
  }

  async cleanup(): Promise<void> {
    try {
      await fs.rm(this.workspacePath, { recursive: true, force: true });
    } catch (error) {
      console.error(`Failed to cleanup workspace ${this.workspacePath}:`, error);
    }
  }
}
