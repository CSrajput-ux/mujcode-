/**
 * MUJCODE Local Compiler — Shared Execution Contracts
 * Strict type contracts for code execution requests, results, and diagnostics.
 */

export type ExecutionStatus =
  | 'SUCCESS'
  | 'COMPILATION_ERROR'
  | 'RUNTIME_ERROR'
  | 'TIME_LIMIT_EXCEEDED'
  | 'OUTPUT_LIMIT_EXCEEDED'
  | 'DEPENDENCY_MISSING'
  | 'CANCELLED'
  | 'INTERNAL_ERROR';

export interface ExecutionRequest {
  requestId: string;
  language: string | number;
  sourceCode: string;
  stdin?: string;
  timeLimitMs?: number;
  schemaSql?: string;
  seedSql?: string;
  rowLimit?: number;
}

export interface ExecutionResult {
  requestId: string;
  status: ExecutionStatus;
  verdict: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  executionTimeMs: number;
  compileError?: string | null;
  truncated: boolean;
  errorCode?: string | null;
  language: string;
  languageId: number;
  missingTool?: string | null;
  installInstruction?: string | null;
  columns?: string[];
  rows?: any[];
  rowCount?: number;
}

export interface LanguageDefinition {
  id: number;
  key: string;
  name: string;
  aliases: string[];
  extension: string;
  isCompiled: boolean;
  supportsStdin: boolean;
  defaultTimeLimitMs: number;
  maxTimeLimitMs: number;
  defaultMemoryLimitMb: number;
  compilerCommand?: string;
  runtimeExecutable: string;
}

export interface ToolchainDiagnostic {
  languageId: number;
  languageKey: string;
  runtimeName: string;
  available: boolean;
  detectedVersion: string | null;
  executablePath: string | null;
  troubleshootingInstructions: string | null;
}
