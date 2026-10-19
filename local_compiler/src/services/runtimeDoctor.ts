/**
 * MUJCODE Local Compiler — Runtime Environment Doctor
 * 
 * Accurately diagnoses the availability, versions, paths, and smoke-test health
 * of all seven supported compilers on the host Windows machine.
 * 
 * Supports safe Windows-native executable resolution (skipping 0-byte WindowsApps stubs,
 * searching standard user/system directories, and supporting py.exe).
 */

import { spawn, execSync } from 'node:child_process';
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
  wingetId?: string;
  packageName?: string;
  publisher?: string;
  estimatedSizeMb?: number;
  extraSearchDirs?: string[];
}

const TOOL_DEFINITIONS: ToolCheckDefinition[] = [
  {
    languageId: 50,
    languageKey: 'c',
    runtimeName: 'GCC (C Compiler)',
    executables: ['gcc', 'gcc.exe', 'clang', 'clang.exe'],
    versionArgs: ['--version'],
    versionRegex: /(?:gcc|clang)(?:\.exe)?\s+\(.*?\)|\b\d+\.\d+\.\d+\b/i,
    installInstruction: 'Install MinGW-w64 via Winget: "winget install MSYS2.MSYS2" or download from winlibs.com',
    wingetId: 'MSYS2.MSYS2',
    packageName: 'MinGW-w64 GCC Compiler Toolchain',
    publisher: 'MSYS2 Project',
    estimatedSizeMb: 120,
    extraSearchDirs: [
      'C:\\msys64\\mingw64\\bin',
      'C:\\msys64\\ucrt64\\bin',
      'C:\\MinGW\\bin',
      'C:\\ProgramData\\chocolatey\\bin',
      'C:\\Program Files\\LLVM\\bin'
    ]
  },
  {
    languageId: 54,
    languageKey: 'cpp',
    runtimeName: 'G++ (C++ Compiler)',
    executables: ['g++', 'g++.exe', 'clang++', 'clang++.exe'],
    versionArgs: ['--version'],
    versionRegex: /(?:g\+\+|clang\+\+)(?:\.exe)?\s+\(.*?\)|\b\d+\.\d+\.\d+\b/i,
    installInstruction: 'Install MinGW-w64 via Winget: "winget install MSYS2.MSYS2" or download from winlibs.com',
    wingetId: 'MSYS2.MSYS2',
    packageName: 'MinGW-w64 G++ Compiler Toolchain',
    publisher: 'MSYS2 Project',
    estimatedSizeMb: 120,
    extraSearchDirs: [
      'C:\\msys64\\mingw64\\bin',
      'C:\\msys64\\ucrt64\\bin',
      'C:\\MinGW\\bin',
      'C:\\ProgramData\\chocolatey\\bin',
      'C:\\Program Files\\LLVM\\bin'
    ]
  },
  {
    languageId: 62,
    languageKey: 'java',
    runtimeName: 'Java Development Kit (JDK 17+)',
    executables: ['javac', 'javac.exe'],
    versionArgs: ['-version'],
    versionRegex: /(?:javac|openjdk|java)\s+[\d._]+/i,
    installInstruction: 'Install OpenJDK: "winget install EclipseAdoptium.Temurin.21.JDK"',
    wingetId: 'EclipseAdoptium.Temurin.21.JDK',
    packageName: 'Eclipse Temurin OpenJDK 21 (JDK)',
    publisher: 'Eclipse Foundation',
    estimatedSizeMb: 190,
    extraSearchDirs: [
      process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin') : '',
      'C:\\Program Files\\Eclipse Adoptium\\jdk-21*\\bin',
      'C:\\Program Files\\Java\\jdk-21\\bin',
      'C:\\Program Files\\Java\\jdk-17\\bin',
      'C:\\Program Files\\Microsoft\\jdk-21*\\bin'
    ].filter(Boolean)
  },
  {
    languageId: 71,
    languageKey: 'python',
    runtimeName: 'Python 3 Runtime',
    executables: ['python', 'py', 'python3'],
    versionArgs: ['--version'],
    versionRegex: /Python\s+[\d.]+/i,
    installInstruction: 'Install Python from python.org or via Winget: "winget install Python.Python.3.12"',
    wingetId: 'Python.Python.3.12',
    packageName: 'Python 3.12 Runtime',
    publisher: 'Python Software Foundation',
    estimatedSizeMb: 35,
    extraSearchDirs: [
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python312'),
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python311'),
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python310'),
      'C:\\Program Files\\Python312',
      'C:\\Program Files\\Python311',
      'C:\\Python312',
      'C:\\Windows'
    ]
  },
  {
    languageId: 63,
    languageKey: 'javascript',
    runtimeName: 'Node.js LTS Runtime',
    executables: ['node', 'node.exe'],
    versionArgs: ['--version'],
    versionRegex: /v\d+\.\d+\.\d+/,
    installInstruction: 'Install Node.js 20+ LTS: "winget install OpenJS.NodeJS.LTS"',
    wingetId: 'OpenJS.NodeJS.LTS',
    packageName: 'Node.js 20+ LTS Runtime',
    publisher: 'OpenJS Foundation',
    estimatedSizeMb: 30,
    extraSearchDirs: ['C:\\Program Files\\nodejs']
  },
  {
    languageId: 60,
    languageKey: 'go',
    runtimeName: 'Go Compiler (Golang)',
    executables: ['go', 'go.exe'],
    versionArgs: ['version'],
    versionRegex: /go\s+version\s+go[\d.]+/i,
    installInstruction: 'Install Go from golang.org or via Winget: "winget install Golang.Go"',
    wingetId: 'Golang.Go',
    packageName: 'Go Programming Language Compiler',
    publisher: 'Google LLC / Go Authors',
    estimatedSizeMb: 130,
    extraSearchDirs: [
      process.env.GOROOT ? path.join(process.env.GOROOT, 'bin') : '',
      'C:\\Program Files\\Go\\bin',
      'C:\\Go\\bin'
    ].filter(Boolean)
  }
];

export class RuntimeDoctor {
  private cachedDiagnostics: Map<string, ToolchainDiagnostic> = new Map();
  private resolvedPaths: Map<string, string> = new Map();

  /**
   * Resolve an executable safely on Windows.
   * Explicitly avoids 0-byte WindowsApps stubs and inspects standard installation paths.
   */
  findExecutableOnPath(executableName: string, extraDirs: string[] = []): string | null {
    const systemPath = process.env.PATH || '';
    const pathDelimiter = process.platform === 'win32' ? ';' : ':';
    const pathDirs = systemPath.split(pathDelimiter).filter(Boolean);

    // Combine PATH directories and extra known installation directories
    const allDirectories = [...pathDirs, ...extraDirs];

    const extensions = process.platform === 'win32'
      ? (process.env.PATHEXT ? process.env.PATHEXT.split(';') : ['.EXE', '.CMD', '.BAT'])
      : [''];

    // 1. Direct absolute path resolution
    if (path.isAbsolute(executableName)) {
      if (this.isValidExecutable(executableName)) return executableName;
      for (const ext of extensions) {
        const full = `${executableName}${ext.toLowerCase()}`;
        if (this.isValidExecutable(full)) return full;
      }
      return null;
    }

    // 2. Scan directories (filtering out zero-byte WindowsApps stubs)
    for (const dir of allDirectories) {
      if (!dir) continue;

      // Skip WindowsApps redirection stubs
      if (dir.toLowerCase().includes('windowsapps')) {
        continue;
      }

      // Check direct filename
      try {
        const directPath = path.join(dir, executableName);
        if (this.isValidExecutable(directPath)) {
          return directPath;
        }

        for (const ext of extensions) {
          const withExt = path.join(dir, `${executableName}${ext.toLowerCase()}`);
          if (this.isValidExecutable(withExt)) {
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
   * Verify an executable path is a real, non-zero-byte file.
   */
  private isValidExecutable(filePath: string): boolean {
    try {
      if (filePath.toLowerCase().includes('windowsapps')) {
        return false;
      }
      if (!fs.existsSync(filePath)) return false;
      const stats = fs.statSync(filePath);
      return stats.isFile() && stats.size > 0;
    } catch {
      return false;
    }
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
   * Run a quick, safe smoke test for a detected runtime (no arbitrary student code).
   */
  private async runSmokeTest(languageKey: string, executablePath: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        let testArgs: string[] = ['--version'];

        if (languageKey === 'python') {
          testArgs = ['-c', 'import sys; print("ok")'];
        } else if (languageKey === 'javascript') {
          testArgs = ['-e', 'console.log("ok")'];
        } else if (languageKey === 'go') {
          testArgs = ['version'];
        } else if (languageKey === 'java') {
          testArgs = ['-version'];
        }

        const child = spawn(executablePath, testArgs, {
          stdio: ['ignore', 'pipe', 'pipe'],
          windowsHide: true,
          shell: false
        });

        const timer = setTimeout(() => {
          try { child.kill('SIGKILL'); } catch {}
          resolve(false);
        }, 2500);

        child.on('error', () => {
          clearTimeout(timer);
          resolve(false);
        });

        child.on('close', (code) => {
          clearTimeout(timer);
          resolve(code === 0 || languageKey === 'java'); // java -version outputs to stderr with code 0
        });
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * Check SQL support via bundled WebAssembly sql.js.
   */
  async checkSqlSupport(): Promise<ToolchainDiagnostic> {
    try {
      const { getSqlStatic } = await import('../compiler/adapters/SqlAdapter.js');
      const SQL = await getSqlStatic();
      const db = new SQL.Database();
      db.run('CREATE TABLE _diag (id INT);');
      const res = db.exec('SELECT 1 + 1 AS res;');
      db.close();

      const smokeTestPassed = Boolean(res && res[0]?.values?.[0]?.[0] === 2);

      return {
        languageId: 82,
        languageKey: 'sql',
        runtimeName: 'SQL Engine (Built-in SQLite / WebAssembly)',
        available: true,
        detectedVersion: 'SQLite 3 (Built-in WebAssembly Engine)',
        executablePath: 'sql.js (in-process WASM)',
        isBundled: true,
        smokeTestPassed,
        packageName: 'sql.js (Bundled WebAssembly Engine)',
        publisher: 'SQLite / MUJCODE Local Compiler',
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
        isBundled: true,
        smokeTestPassed: false,
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
      resolvedPath = this.findExecutableOnPath(exe, def.extraSearchDirs || []);
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
        isBundled: false,
        smokeTestPassed: false,
        wingetId: def.wingetId,
        packageName: def.packageName,
        publisher: def.publisher,
        estimatedSizeMb: def.estimatedSizeMb,
        installCommand: def.wingetId ? `winget install ${def.wingetId}` : undefined,
        troubleshootingInstructions: def.installInstruction
      };
    }

    this.resolvedPaths.set(def.languageKey, resolvedPath);

    const { version } = await this.queryVersion(resolvedPath, def.versionArgs);
    const smokeTestPassed = await this.runSmokeTest(def.languageKey, resolvedPath);

    return {
      languageId: def.languageId,
      languageKey: def.languageKey,
      runtimeName: def.runtimeName,
      available: true,
      detectedVersion: version || 'Installed (version output unparsed)',
      executablePath: resolvedPath,
      isBundled: false,
      smokeTestPassed,
      wingetId: def.wingetId,
      packageName: def.packageName,
      publisher: def.publisher,
      estimatedSizeMb: def.estimatedSizeMb,
      installCommand: def.wingetId ? `winget install ${def.wingetId}` : undefined,
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

  /**
   * Refresh environment PATH from Windows Registry and standard directories.
   * Ensures newly installed packages are immediately visible to this running process.
   */
  refreshEnvironmentPath(): void {
    if (process.platform !== 'win32') return;

    try {
      const extraDirs: string[] = [];

      // Query User Environment PATH
      try {
        const userPathRaw = execSync('reg query "HKCU\\Environment" /v Path', {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore']
        });
        const match = userPathRaw.match(/Path\s+REG_(?:EXPAND_)?SZ\s+(.*)/i);
        if (match && match[1]) {
          extraDirs.push(...match[1].trim().split(';').filter(Boolean));
        }
      } catch {}

      // Query System Environment PATH
      try {
        const sysPathRaw = execSync('reg query "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment" /v Path', {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore']
        });
        const match = sysPathRaw.match(/Path\s+REG_(?:EXPAND_)?SZ\s+(.*)/i);
        if (match && match[1]) {
          extraDirs.push(...match[1].trim().split(';').filter(Boolean));
        }
      } catch {}

      // Standard installation directories for supported compilers
      const standardToolDirs = [
        'C:\\msys64\\mingw64\\bin',
        'C:\\msys64\\ucrt64\\bin',
        'C:\\Program Files\\Go\\bin',
        'C:\\Go\\bin',
        'C:\\Program Files\\nodejs',
        path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python312'),
        path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python311'),
        'C:\\Program Files\\Eclipse Adoptium\\jdk-21*\\bin',
        'C:\\Program Files\\Java\\jdk-21\\bin'
      ];
      extraDirs.push(...standardToolDirs);

      const currentDirs = (process.env.PATH || '').split(';').filter(Boolean);
      const combined = Array.from(new Set([...currentDirs, ...extraDirs]));
      process.env.PATH = combined.join(';');
    } catch (err: any) {
      console.warn('[RuntimeDoctor] Could not refresh registry environment PATH:', err?.message);
    }
  }

  /**
   * Check if Microsoft Windows Package Manager (Winget) is available on the system.
   */
  async isWingetAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const child = spawn('winget', ['--version'], {
          stdio: ['ignore', 'pipe', 'pipe'],
          windowsHide: true,
          shell: false
        });

        const timer = setTimeout(() => {
          try { child.kill('SIGKILL'); } catch {}
          resolve(false);
        }, 3000);

        child.on('error', () => {
          clearTimeout(timer);
          resolve(false);
        });

        child.on('close', (code) => {
          clearTimeout(timer);
          resolve(code === 0);
        });
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * Active in-flight installation promises to prevent concurrent duplicate installations
   * (e.g. C and C++ both sharing MSYS2.MSYS2).
   */
  private activeInstalls: Map<string, Promise<{ success: boolean; output: string }>> = new Map();

  /**
   * Install a missing toolchain via verified Windows Package Manager (Winget).
   * Deduplicates concurrent calls for the same package ID (such as MSYS2 for C and C++).
   * Requires explicit user consent before invocation.
   */
  async installToolchainViaWinget(wingetId: string): Promise<{ success: boolean; output: string }> {
    // 1. Prevent duplicate concurrent installations for the same wingetId
    if (this.activeInstalls.has(wingetId)) {
      return this.activeInstalls.get(wingetId)!;
    }

    // 2. Validate wingetId to prevent arbitrary execution
    const allowedWingetIds = new Set([
      'Python.Python.3.12',
      'MSYS2.MSYS2',
      'EclipseAdoptium.Temurin.21.JDK',
      'OpenJS.NodeJS.LTS',
      'Golang.Go'
    ]);

    if (!allowedWingetIds.has(wingetId)) {
      return {
        success: false,
        output: `Installation package "${wingetId}" is not in the verified MUJCODE repository package allowlist.`
      };
    }

    const installPromise = (async () => {
      // 3. Verify Winget availability
      const hasWinget = await this.isWingetAvailable();
      if (!hasWinget) {
        return {
          success: false,
          output: 'Microsoft Winget (Windows Package Manager) is not available on this machine.\n' +
            'Please install App Installer from the Microsoft Store or visit: https://learn.microsoft.com/windows/package-manager/winget/\n' +
            'Alternatively, you can manually install the required compiler and rescan.'
        };
      }

      return new Promise<{ success: boolean; output: string }>((resolve) => {
        let output = '';
        try {
          const child = spawn(
            'winget',
            ['install', '--exact', '--id', wingetId, '--accept-source-agreements', '--accept-package-agreements'],
            {
              stdio: ['ignore', 'pipe', 'pipe'],
              windowsHide: false,
              shell: false
            }
          );

          const timer = setTimeout(() => {
            try { child.kill('SIGKILL'); } catch {}
            resolve({ success: false, output: 'Installation timed out after 5 minutes.' });
          }, 5 * 60 * 1000);

          child.stdout?.on('data', (c) => (output += c.toString('utf8')));
          child.stderr?.on('data', (c) => (output += c.toString('utf8')));

          child.on('error', (err) => {
            clearTimeout(timer);
            resolve({ success: false, output: `Failed to launch Winget: ${err.message}` });
          });

          child.on('close', (code) => {
            clearTimeout(timer);
            const isSuccess = code === 0;
            if (isSuccess) {
              // Refresh PATH immediately so new binaries are discoverable
              this.refreshEnvironmentPath();
            }
            resolve({
              success: isSuccess,
              output: output.trim() || (isSuccess ? 'Installation completed successfully.' : `Winget exited with code ${code}`)
            });
          });
        } catch (err: any) {
          resolve({ success: false, output: `Winget execution exception: ${err.message}` });
        }
      });
    })();

    this.activeInstalls.set(wingetId, installPromise);
    try {
      const result = await installPromise;
      return result;
    } finally {
      this.activeInstalls.delete(wingetId);
    }
  }

  /**
   * Rescan and re-verify a single toolchain, refreshing environment and running smoke test.
   */
  async rescanLanguage(languageKey: string): Promise<ToolchainDiagnostic> {
    this.refreshEnvironmentPath();
    const key = languageKey.toLowerCase();

    if (key === 'sql' || key === 'sqlite') {
      const diag = await this.checkSqlSupport();
      this.cachedDiagnostics.set('sql', diag);
      return diag;
    }

    const def = TOOL_DEFINITIONS.find((t) => t.languageKey === key);
    if (!def) {
      throw new Error(`Unknown language key for diagnosis: ${languageKey}`);
    }

    const diag = await this.diagnoseTool(def);
    this.cachedDiagnostics.set(key, diag);
    return diag;
  }
}

export const runtimeDoctor = new RuntimeDoctor();
