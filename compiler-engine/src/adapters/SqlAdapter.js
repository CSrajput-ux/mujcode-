import { DatabaseSync } from 'node:sqlite';
import { BaseAdapter } from './BaseAdapter.js';

const FORBIDDEN_SQL = [
  /\bATTACH\b(?:\s+DATABASE)?/i,
  /\bDETACH\b(?:\s+DATABASE)?/i,
  /\bPRAGMA\s+(?:writable_schema|database_list|compile_options)/i,
  /\bload_extension\b/i,
  /\breadfile\b/i,
  /\bwritefile\b/i
];

function formatAsciiTable(columns, rows) {
  if (!columns || columns.length === 0) return 'Query executed successfully. (0 rows)';
  if (!rows || rows.length === 0) return columns.join(' | ') + '\n(0 rows returned)';

  const colWidths = {};
  columns.forEach(col => {
    colWidths[col] = String(col).length;
  });

  rows.forEach(row => {
    columns.forEach(col => {
      const val = row[col] === null ? 'NULL' : String(row[col] ?? '');
      if (val.length > colWidths[col]) {
        colWidths[col] = Math.min(val.length, 50);
      }
    });
  });

  const header = columns.map(c => String(c).padEnd(colWidths[c])).join(' | ');
  const separator = columns.map(c => '-'.repeat(colWidths[c])).join('-+-');
  const body = rows.map(row =>
    columns.map(c => {
      const val = row[c] === null ? 'NULL' : String(row[c] ?? '');
      return val.length > 50 ? val.slice(0, 47) + '...' : val.padEnd(colWidths[c]);
    }).join(' | ')
  ).join('\n');

  return `${header}\n${separator}\n${body}\n(${rows.length} row${rows.length === 1 ? '' : 's'})`;
}

export class SqlAdapter extends BaseAdapter {
  validateSafety(sql) {
    if (!sql) return;
    for (const pattern of FORBIDDEN_SQL) {
      if (pattern.test(sql)) {
        throw new Error(`Security Exception: Disallowed SQL pattern detected: ${pattern.source}`);
      }
    }
  }

  async execute({ sourceCode, stdin = '', schemaSql = '', seedSql = '', rowLimit = 100, timeLimit = 2 }) {
    const startTime = process.hrtime.bigint();
    if (!sourceCode || !String(sourceCode).trim()) {
      return {
        status: 'COMPILATION_ERROR',
        statusId: 6,
        verdict: 'Compilation Error',
        compileOutput: 'SQL query cannot be empty',
        stdout: '',
        stderr: 'SQL query cannot be empty',
        exitCode: 1,
        timeMs: 0,
        memoryKb: null
      };
    }

    const query = String(sourceCode).trim();
    try {
      this.validateSafety(query);
      if (schemaSql) this.validateSafety(schemaSql);
      if (seedSql) this.validateSafety(seedSql);
    } catch (err) {
      return {
        status: 'RUNTIME_ERROR',
        statusId: 11,
        verdict: 'Runtime Error',
        compileOutput: '',
        stdout: '',
        stderr: err.message,
        exitCode: 1,
        timeMs: 0,
        memoryKb: null
      };
    }

    let db = null;
    const safeLimit = Math.min(1000, Math.max(1, Number(rowLimit) || 100));

    try {
      // Create fresh, disposable in-memory database
      db = new DatabaseSync(':memory:');
      db.exec('PRAGMA foreign_keys = ON;');
      db.exec('PRAGMA max_page_count = 5000;'); // ~20 MB memory cap

      // Seed & Schema
      if (schemaSql) db.exec(schemaSql);
      if (seedSql) db.exec(seedSql);

      // Stdin may also contain DDL/DML setup
      if (stdin && String(stdin).trim()) {
        const stdinClean = String(stdin).trim();
        if (/CREATE|INSERT|UPDATE|DELETE|ALTER|DROP/i.test(stdinClean)) {
          this.validateSafety(stdinClean);
          db.exec(stdinClean);
        }
      }

      const statements = query
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      let lastResultRows = [];
      let lastColumns = [];
      let totalChanges = 0;
      const MAX_EXEC_TIME_MS = Math.min(5000, Number(timeLimit || 2) * 1000);

      for (const stmtText of statements) {
        this.validateSafety(stmtText);
        const isSelect = /^\s*(?:SELECT|WITH|PRAGMA\s+table_info|EXPLAIN)/i.test(stmtText);

        if (isSelect) {
          const stmt = db.prepare(stmtText);
          const rows = [];
          const iterStart = Date.now();

          for (const row of stmt.iterate()) {
            rows.push(row);
            if (rows.length >= safeLimit) break;
            if (Date.now() - iterStart > MAX_EXEC_TIME_MS) {
              const err = new Error('Query execution time limit exceeded');
              err.code = 'TIME_LIMIT_EXCEEDED';
              throw err;
            }
          }

          lastResultRows = rows;
          lastColumns = rows.length > 0 ? Object.keys(rows[0]) : [];
        } else {
          const stmt = db.prepare(stmtText);
          const result = stmt.run();
          totalChanges += (result?.changes || 0);
        }
      }

      const endTime = process.hrtime.bigint();
      const elapsedMs = Math.round(Number(endTime - startTime) / 1e6);
      const formattedOutput = lastColumns.length > 0 || lastResultRows.length > 0
        ? formatAsciiTable(lastColumns, lastResultRows)
        : `Statements executed successfully. (${totalChanges} row(s) affected)`;

      return {
        status: 'ACCEPTED',
        statusId: 3,
        verdict: 'Accepted',
        compileOutput: '',
        stdout: formattedOutput,
        stderr: '',
        columns: lastColumns,
        rows: lastResultRows,
        rowCount: lastResultRows.length,
        exitCode: 0,
        timeMs: elapsedMs,
        memoryKb: null
      };
    } catch (err) {
      const endTime = process.hrtime.bigint();
      const elapsedMs = Math.round(Number(endTime - startTime) / 1e6);

      if (err.code === 'TIME_LIMIT_EXCEEDED') {
        return {
          status: 'TIME_LIMIT_EXCEEDED',
          statusId: 5,
          verdict: 'Time Limit Exceeded',
          compileOutput: '',
          stdout: '',
          stderr: 'Time Limit Exceeded: Query execution took too long.',
          exitCode: 124,
          timeMs: elapsedMs,
          memoryKb: null
        };
      }

      return {
        status: 'RUNTIME_ERROR',
        statusId: 11,
        verdict: 'Runtime Error',
        compileOutput: '',
        stdout: '',
        stderr: `SQL Error: ${err.message}`,
        exitCode: 1,
        timeMs: elapsedMs,
        memoryKb: null
      };
    } finally {
      if (db) {
        try { db.close(); } catch {}
      }
    }
  }
}
