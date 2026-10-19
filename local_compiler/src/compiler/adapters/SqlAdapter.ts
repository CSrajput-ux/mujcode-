/**
 * MUJCODE Local Compiler — SQL Language Adapter (Language ID 82)
 * 
 * Uses SQLite WebAssembly engine (sql.js inline WASM) with strict in-memory sandboxing.
 * Fully compatible with Electron main process and Node.js runtimes.
 */

import type { Database, SqlJsStatic } from 'sql.js';
// @ts-ignore
import initSqlJs from 'sql.js/dist/sql-wasm-inline.js';
import { BaseAdapter, AdapterExecuteParams } from './BaseAdapter.js';
import { ExecutionResult } from '../../shared/executionTypes.js';

const FORBIDDEN_SQL = [
  /\bATTACH\b(?:\s+DATABASE)?/i,
  /\bDETACH\b(?:\s+DATABASE)?/i,
  /\bPRAGMA\s+(?:writable_schema|database_list|compile_options)/i,
  /\bload_extension\b/i,
  /\breadfile\b/i,
  /\bwritefile\b/i
];

let sqlStaticPromise: Promise<SqlJsStatic> | null = null;

export async function getSqlStatic(): Promise<SqlJsStatic> {
  if (!sqlStaticPromise) {
    const factory = (initSqlJs as any).default || initSqlJs;
    sqlStaticPromise = factory();
  }
  return await sqlStaticPromise!;
}

function formatAsciiTable(columns: string[], rows: any[]): string {
  if (!columns || columns.length === 0) return 'Query executed successfully. (0 rows)';
  if (!rows || rows.length === 0) return columns.join(' | ') + '\n(0 rows returned)';

  const colWidths: Record<string, number> = {};
  columns.forEach((col) => {
    colWidths[col] = String(col).length;
  });

  rows.forEach((row) => {
    columns.forEach((col) => {
      const val = row[col] === null ? 'NULL' : String(row[col] ?? '');
      if (val.length > colWidths[col]) {
        colWidths[col] = Math.min(val.length, 50);
      }
    });
  });

  const header = columns.map((c) => String(c).padEnd(colWidths[c])).join(' | ');
  const separator = columns.map((c) => '-'.repeat(colWidths[c])).join('-+-');
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const val = row[c] === null ? 'NULL' : String(row[c] ?? '');
          return val.length > 50 ? val.slice(0, 47) + '...' : val.padEnd(colWidths[c]);
        })
        .join(' | ')
    )
    .join('\n');

  return `${header}\n${separator}\n${body}\n(${rows.length} row${rows.length === 1 ? '' : 's'})`;
}

export class SqlAdapter extends BaseAdapter {
  private validateSafety(sql: string): void {
    if (!sql) return;
    for (const pattern of FORBIDDEN_SQL) {
      if (pattern.test(sql)) {
        throw new Error(`Security Exception: Disallowed SQL pattern detected: ${pattern.source}`);
      }
    }
  }

  async execute(params: AdapterExecuteParams): Promise<ExecutionResult> {
    const { requestId, sourceCode, stdin = '', schemaSql = '', seedSql = '', rowLimit = 100, timeLimitMs } = params;
    const startTime = process.hrtime.bigint();

    if (!sourceCode || !String(sourceCode).trim()) {
      return {
        requestId,
        status: 'COMPILATION_ERROR',
        verdict: 'Compilation Error',
        stdout: '',
        stderr: 'SQL query cannot be empty',
        compileError: 'SQL query cannot be empty',
        exitCode: 1,
        executionTimeMs: 0,
        truncated: false,
        language: this.lang.name,
        languageId: this.lang.id
      };
    }

    const query = String(sourceCode).trim();
    try {
      this.validateSafety(query);
      if (schemaSql) this.validateSafety(schemaSql);
      if (seedSql) this.validateSafety(seedSql);
    } catch (err: any) {
      return {
        requestId,
        status: 'RUNTIME_ERROR',
        verdict: 'Runtime Error',
        stdout: '',
        stderr: err.message,
        exitCode: 1,
        executionTimeMs: 0,
        truncated: false,
        language: this.lang.name,
        languageId: this.lang.id
      };
    }

    let db: Database | null = null;
    const safeLimit = Math.min(1000, Math.max(1, Number(rowLimit) || 100));

    try {
      const SQL = await getSqlStatic();
      // Create clean, in-memory disposable database
      db = new SQL.Database();
      db.run('PRAGMA foreign_keys = ON;');

      if (schemaSql) db.run(schemaSql);
      if (seedSql) db.run(seedSql);

      if (stdin && String(stdin).trim()) {
        const stdinClean = String(stdin).trim();
        if (/CREATE|INSERT|UPDATE|DELETE|ALTER|DROP/i.test(stdinClean)) {
          this.validateSafety(stdinClean);
          db.run(stdinClean);
        }
      }

      const statements = query
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      let lastResultRows: any[] = [];
      let lastColumns: string[] = [];
      let totalChanges = 0;
      const effectiveTimeLimitMs = Math.min(5000, Number(timeLimitMs || this.lang.defaultTimeLimitMs));

      for (const stmtText of statements) {
        this.validateSafety(stmtText);
        const isSelect = /^\s*(?:SELECT|WITH|PRAGMA\s+table_info|EXPLAIN)/i.test(stmtText);

        if (isSelect) {
          const stmt = db.prepare(stmtText);
          const rows: any[] = [];
          const iterStart = Date.now();
          const cols = stmt.getColumnNames();

          while (stmt.step()) {
            rows.push(stmt.getAsObject());
            if (rows.length >= safeLimit) break;
            if (Date.now() - iterStart > effectiveTimeLimitMs) {
              stmt.free();
              const err: any = new Error('Query execution time limit exceeded');
              err.code = 'TIME_LIMIT_EXCEEDED';
              throw err;
            }
          }
          stmt.free();

          lastResultRows = rows;
          lastColumns = cols.length > 0 ? cols : (rows.length > 0 ? Object.keys(rows[0]) : []);
        } else {
          db.run(stmtText);
          totalChanges += db.getRowsModified();
        }
      }

      const endTime = process.hrtime.bigint();
      const elapsedMs = Math.round(Number(endTime - startTime) / 1e6);
      const formattedOutput =
        lastColumns.length > 0 || lastResultRows.length > 0
          ? formatAsciiTable(lastColumns, lastResultRows)
          : `Statements executed successfully. (${totalChanges} row(s) affected)`;

      return {
        requestId,
        status: 'SUCCESS',
        verdict: 'Accepted',
        stdout: formattedOutput,
        stderr: '',
        columns: lastColumns,
        rows: lastResultRows,
        rowCount: lastResultRows.length,
        exitCode: 0,
        executionTimeMs: elapsedMs,
        truncated: false,
        language: this.lang.name,
        languageId: this.lang.id
      };
    } catch (err: any) {
      const endTime = process.hrtime.bigint();
      const elapsedMs = Math.round(Number(endTime - startTime) / 1e6);

      if (err.code === 'TIME_LIMIT_EXCEEDED') {
        return {
          requestId,
          status: 'TIME_LIMIT_EXCEEDED',
          verdict: 'Time Limit Exceeded',
          stdout: '',
          stderr: 'Time Limit Exceeded: Query execution took too long.',
          exitCode: 124,
          executionTimeMs: elapsedMs,
          truncated: false,
          language: this.lang.name,
          languageId: this.lang.id
        };
      }

      return {
        requestId,
        status: 'RUNTIME_ERROR',
        verdict: 'Runtime Error',
        stdout: '',
        stderr: `SQL Error: ${err.message}`,
        exitCode: 1,
        executionTimeMs: elapsedMs,
        truncated: false,
        language: this.lang.name,
        languageId: this.lang.id
      };
    } finally {
      if (db) {
        try {
          db.close();
        } catch {}
      }
    }
  }
}
