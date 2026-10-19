/**
 * MUJCODE Local Compiler — Runtime Environment Doctor
 * 
 * Accurately diagnoses the availability, versions, and paths of required compilers
 * and language runtimes on the host machine.
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { ToolchainDiagnostic } from '../shared/executionTypes.js';

interface ToolCheckDefinition {
  languageId: number;
  languageKey: string;
  runtimeName: string;
  executables: string[];
  versionArgs: string[];
  versionRegex: RegExp;
  installInstruction: string;
}

const TOOL_DEFINITIONS: ToolCheckDefinition[] = [
  {
    languageId: 50,
    languageKey: 'c',
    runtimeName: 'GCC (C Compiler)',
    executables: ['gcc', 'gcc.exe'],
    versionArgs: ['--version'],
    versionRegex: /gcc(?:\.exe)?\s+\(.*?\)|\b\d+\.\d+\.\d+\b/i,
    installInstruction: 'Install MinGW-w64 via Winget: "winget install MSYS2.MSYS2" or download from winlibs.com'
  },
  {
    languageId: 54,
    languageKey: 'cpp',
    runtimeName: 'G++ (C++ Compiler)',
    executables: ['g++', 'g++.exe'],
    versionArgs: ['--version'],
    versionRegex: /g\+\+(?:\.exe)?\s+\(.*?\)|\b\d+\.\d+\.\d+\b/i,
    installInstruction: 'Install MinGW-w64 via Winget: "winget install MSYS2.MSYS2" or download from winlibs.com'
  },
  {
    languageId: 62,
    languageKey: 'java',
    runtimeName: 'Java Development Kit (JDK 17+)',
    executables: ['javac', 'javac.exe'],
    versionArgs: ['-version'],
    versionRegex: /javac\s+[\d._]+/i,
    installInstruction: 'Install OpenJDK or Oracle JDK: "winget install Oracle.JDK.17"'
  },
  {
    languageId: 71,
    languageKey: 'python',
    runtimeName: 'Python 3 Runtime',
    executables: ['python', 'py', 'python3'],
    versionArgs: ['--version'],
    versionRegex: /Python\s+[\d.]+/i,
    installInstruction: 'Install Python from python.org or via Winget: "winget install Python.Python.3.11"'
  },
  {
    languageId: 63,
    languageKey: 'javascript',
    runtimeName: 'Node.js LTS Runtime',
    executables: ['node', 'node.exe'],
    versionArgs: ['--version'],
    versionRegex: /v\d+\.\d+\.\d+/,
    installInstruction: 'Install Node.js 20+ from nodejs.org or via Winget: "winget install OpenJS.NodeJS.LTS"'
  },
  {
    languageId: 60,
    languageKey: 'go',
    runtimeName: 'Go Compiler (Golang)',
    executables: ['go', 'go.exe'],
    versionArgs: ['version'],
    versionRegex: /go\s+version\s+go[\d.]+/i,
    installInstruction: 'Install Go from golang.org or via Winget: "winget install Golang.Go"'
  }
];

export class RuntimeDoctor {
  private cachedDiagnostics: Map<string, ToolchainDiagnostic> = new Map();
  private resolvedPaths: Map<string, string> = new Map();

  /**
   * Resolve an executable name against system PATH on Windows.
   */
  findExecutableOnPath(executableName: string): string | null {
    const systemPath = process.env.PATH || '';
    const pathDelimiter = process.platform === 'win32' ? ';' : ':';
    const directories = systemPath.split(pathDelimiter).filter(Boolean);

    const extensions = process.platform === 'win32'
      ? (process.env.PATHEXT ? process.env.PATHEXT.split(';') : ['.EXE', '.CMD', '.BAT'])
      : [''];

    // If an explicit path is given
    if (path.isAbsolute(executableName)) {
      if (fs.existsSync(executableName)) return executableName;
      for (const ext of extensions) {
        const full = `${executableName}${ext.toLowerCase()}`;
        if (fs.existsSync(full)) return full;
      }
      return null;
    }

    for (const dir of directories) {
      try {
        const directPath = path.join(dir, executableName);
        if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
          return directPath;
        }

        for (const ext of extensions) {
          const withExt = path.join(dir, `${executableName}${ext.toLowerCase()}`);
          if (fs.existsSync(withExt) && fs.statSync(withExt).isFile()) {
            return withExt;
          }
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  /**
   * Run executable with versionArgs to extract its version string safely.
   */
  private async queryVersion(
    executablePath: string,
    args: string[]
  ): Promise<{ success: boolean; version: string | null }> {
    return new Promise((resolve) => {
      let output = '';
      try {
        const child = spawn(executablePath, args, {
          stdio: ['ignore', 'pipe', 'pipe'],
          windowsHide: true,
          shell: false
        });

        const timer = setTimeout(() => {
          try { child.kill('SIGKILL'); } catch {}
          resolve({ success: false, version: null });
        }, 3000);

        child.stdout?.on('data', (c) => (output += c.toString('utf8')));
        child.stderr?.on('data', (c) => (output += c.toString('utf8')));

        child.on('error', () => {
          clearTimeout(timer);
          resolve({ success: false, version: null });
        });

        child.on('close', (code) => {
          clearTimeout(timer);
          const trimmed = output.trim().split('\n')[0] || '';
          resolve({ success: code === 0 || trimmed.length > 0, version: trimmed || null });
        });
      } catch {
        resolve({ success: false, version: null });
      }
    });
  }

  /**
   * Check SQL support via native node:sqlite.
   */
  async checkSqlSupport(): Promise<ToolchainDiagnostic> {
    try {
      const { getSqlStatic } = await import('../compiler/adapters/SqlAdapter.js');
      const SQL = await getSqlStatic();
      const db = new SQL.Database();
      db.run('CREATE TABLE _diag (id INT);');
      db.close();

      return {
        languageId: 82,
        languageKey: 'sql',
        runtimeName: 'SQL Engine (Built-in SQLite / WebAssembly)',
        available: true,
        detectedVersion: 'SQLite 3 (Built-in WebAssembly Engine)',
        executablePath: 'sql.js (in-process WASM)',
        troubleshootingInstructions: null
      };
    } catch (err: any) {
      return {
        languageId: 82,
        languageKey: 'sql',
        runtimeName: 'SQL Engine (Built-in SQLite / WebAssembly)',
        available: false,
        detectedVersion: null,
        executablePath: null,
        troubleshootingInstructions: `SQLite WebAssembly engine unavailable: ${err.message}`
      };
    }
  }

  /**
   * Diagnose single tool definition.
   */
  async diagnoseTool(def: ToolCheckDefinition): Promise<ToolchainDiagnostic> {
    let resolvedPath: string | null = null;

    for (const exe of def.executables) {
      resolvedPath = this.findExecutableOnPath(exe);
      if (resolvedPath) break;
    }

    if (!resolvedPath) {
      return {
        languageId: def.languageId,
        languageKey: def.languageKey,
        runtimeName: def.runtimeName,
        available: false,
        detectedVersion: null,
        executablePath: null,
        troubleshootingInstructions: def.installInstruction
      };
    }

    this.resolvedPaths.set(def.languageKey, resolvedPath);

    const { version } = await this.queryVersion(resolvedPath, def.versionArgs);

    return {
      languageId: def.languageId,
      languageKey: def.languageKey,
      runtimeName: def.runtimeName,
      available: true,
      detectedVersion: version || 'Installed (version output unparsed)',
      executablePath: resolvedPath,
      troubleshootingInstructions: null
    };
  }

  /**
   * Run full diagnostics for all seven languages.
   */
  async diagnoseAll(): Promise<ToolchainDiagnostic[]> {
    const results: ToolchainDiagnostic[] = [];

    for (const def of TOOL_DEFINITIONS) {
      const diag = await this.diagnoseTool(def);
      this.cachedDiagnostics.set(def.languageKey, diag);
      results.push(diag);
    }

    // SQL diagnostic
    const sqlDiag = await this.checkSqlSupport();
    this.cachedDiagnostics.set('sql', sqlDiag);
    results.push(sqlDiag);

    return results;
  }

  /**
   * Get cached or freshly evaluated diagnostic for a language.
   */
  async getDiagnosticForLanguage(languageKey: string): Promise<ToolchainDiagnostic> {
    const cached = this.cachedDiagnostics.get(languageKey.toLowerCase());
    if (cached) return cached;

    if (languageKey.toLowerCase() === 'sql' || languageKey.toLowerCase() === 'sqlite') {
      return this.checkSqlSupport();
    }

    const def = TOOL_DEFINITIONS.find((t) => t.languageKey === languageKey.toLowerCase());
    if (!def) {
      throw new Error(`Unknown language key for diagnosis: ${languageKey}`);
    }

    const diag = await this.diagnoseTool(def);
    this.cachedDiagnostics.set(languageKey.toLowerCase(), diag);
    return diag;
  }

  /**
   * Get resolved path for a tool executable if found.
   */
  getResolvedPath(toolKey: string): string | null {
    return this.resolvedPaths.get(toolKey.toLowerCase()) || null;
  }
}

export const runtimeDoctor = new RuntimeDoctor();
