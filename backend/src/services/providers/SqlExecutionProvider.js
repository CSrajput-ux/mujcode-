import { DatabaseSync } from 'node:sqlite';
import { BaseExecutionProvider } from './BaseExecutionProvider.js';
import { logger } from '../../lib/logger.js';

// Block commands that could interact with host filesystem or execute arbitrary code
const FORBIDDEN_SQL_PATTERNS = [
  /\bATTACH\b(?:\s+DATABASE)?/i,
  /\bDETACH\b(?:\s+DATABASE)?/i,
  /\bPRAGMA\s+(?:writable_schema|database_list|compile_options)/i,
  /\bload_extension\b/i,
  /\breadfile\b/i,
  /\bwritefile\b/i
];

const DEFAULT_ROW_LIMIT = 100;
const MAX_ROW_LIMIT = 1000;
const EXECUTION_TIMEOUT_MS = 3000;

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
        colWidths[col] = Math.min(val.length, 50); // cap column width at 50 chars
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

function normalizeOutput(str) {
  return String(str || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trim();
}

export class SqlExecutionProvider extends BaseExecutionProvider {
  constructor() {
    super('sql');
  }

  /**
   * Check if SQL contains disallowed keywords/operations
   */
  static validateSqlSafety(sql) {
    for (const pattern of FORBIDDEN_SQL_PATTERNS) {
      if (pattern.test(sql)) {
        throw new Error(`Security Exception: Disallowed SQL operation detected matching rule '${pattern.source}'`);
      }
    }
  }

  /**
   * Execute arbitrary SQL in an isolated, ephemeral in-memory database
   */
  async runCode({
    sourceCode,
    stdin = '',
    schemaSql = '',
    seedSql = '',
    rowLimit = DEFAULT_ROW_LIMIT,
    timeLimit = 2
  }) {
    const startTime = process.hrtime.bigint();
    if (!sourceCode || !String(sourceCode).trim()) {
      throw new Error('SQL query cannot be empty');
    }

    const query = String(sourceCode).trim();
    SqlExecutionProvider.validateSqlSafety(query);
    if (schemaSql) SqlExecutionProvider.validateSqlSafety(schemaSql);
    if (seedSql) SqlExecutionProvider.validateSqlSafety(seedSql);

    const safeLimit = Math.min(MAX_ROW_LIMIT, Math.max(1, Number(rowLimit) || DEFAULT_ROW_LIMIT));
    let db = null;

    try {
      // 1. Fresh ephemeral in-memory SQLite instance
      db = new DatabaseSync(':memory:');

      // Set safety pragmas and strict memory ceiling (prevents OOM on free tier)
      db.exec('PRAGMA foreign_keys = ON;');
      db.exec('PRAGMA query_only = OFF;');
      db.exec('PRAGMA max_page_count = 5000;'); // ~20 MB max memory ceiling

      // 2. Load schema / seed if provided
      if (schemaSql) db.exec(schemaSql);
      if (seedSql) db.exec(seedSql);

      // If stdin contains schema/seed setup (e.g. DDL/DML statements separated by semicolons)
      if (stdin && String(stdin).trim()) {
        const stdinClean = String(stdin).trim();
        // If stdin looks like SQL DDL/DML, execute it
        if (/CREATE|INSERT|UPDATE|DELETE|ALTER|DROP/i.test(stdinClean)) {
          SqlExecutionProvider.validateSqlSafety(stdinClean);
          db.exec(stdinClean);
        }
      }

      // 3. Execute user queries
      // Split into statements if multiple statements exist
      const statements = query
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      let lastResultRows = [];
      let lastColumns = [];
      let totalChanges = 0;
      const MAX_EXEC_TIME_MS = 2000; // 2 seconds hard execution limit

      for (const stmtText of statements) {
        SqlExecutionProvider.validateSqlSafety(stmtText);

        const isSelect = /^\s*(?:SELECT|WITH|PRAGMA\s+table_info|EXPLAIN)/i.test(stmtText);

        if (isSelect) {
          const stmt = db.prepare(stmtText);
          const rows = [];
          const iterStart = Date.now();

          // Stream rows iteratively — breaks early to prevent infinite loops (e.g. infinite recursive CTEs)
          for (const row of stmt.iterate()) {
            rows.push(row);
            if (rows.length >= safeLimit) {
              break;
            }
            if (Date.now() - iterStart > MAX_EXEC_TIME_MS) {
              const err = new Error('Query execution time limit exceeded (2.0s limit)');
              err.code = 'TIME_LIMIT_EXCEEDED';
              throw err;
            }
          }

          lastResultRows = rows;
          lastColumns = rows.length > 0 ? Object.keys(rows[0]) : [];
        } else {
          // DDL / DML execution
          const stmt = db.prepare(stmtText);
          const result = stmt.run();
          totalChanges += (result?.changes || 0);
        }
      }

      const endTime = process.hrtime.bigint();
      const elapsedSeconds = Number(endTime - startTime) / 1e9;
      const formattedOutput = lastColumns.length > 0 || lastResultRows.length > 0
        ? formatAsciiTable(lastColumns, lastResultRows)
        : `Statements executed successfully. (${totalChanges} row(s) affected)`;

      return {
        success: true,
        status: 'ACCEPTED',
        verdict: 'Accepted',
        stdout: formattedOutput,
        stderr: '',
        compileOutput: '',
        columns: lastColumns,
        rows: lastResultRows,
        rowCount: lastResultRows.length,
        time: Number(elapsedSeconds.toFixed(3)),
        memory: 1024, // In-memory instance footprint approx 1MB
        message: null
      };
    } catch (err) {
      const endTime = process.hrtime.bigint();
      const elapsedSeconds = Number(endTime - startTime) / 1e9;
      const isTimeLimit = err.code === 'TIME_LIMIT_EXCEEDED' || err.message?.includes('time limit exceeded');
      const isOom = err.message?.includes('database or disk is full');
      const isSyntax = err.code === 'ERR_SQLITE_ERROR' || err.message?.includes('syntax error');

      return {
        success: false,
        status: isTimeLimit ? 'TIME_LIMIT_EXCEEDED' : isOom ? 'MEMORY_LIMIT_EXCEEDED' : isSyntax ? 'COMPILATION_ERROR' : 'RUNTIME_ERROR',
        verdict: isTimeLimit ? 'Time Limit Exceeded' : isOom ? 'Memory Limit Exceeded' : isSyntax ? 'Syntax Error' : 'Runtime Error',
        stdout: '',
        stderr: err.message || 'SQL Execution Error',
        compileOutput: isSyntax ? err.message : '',
        columns: [],
        rows: [],
        rowCount: 0,
        time: Number(elapsedSeconds.toFixed(3)),
        memory: 1024,
        message: err.message
      };
    } finally {
      if (db) {
        try {
          db.close();
        } catch (closeErr) {
          logger.warn('[SqlExecutionProvider] Error closing ephemeral db:', closeErr);
        }
      }
    }
  }

  /**
   * Execute SQL against multiple test cases
   */
  async executeTestCases({
    sourceCode,
    testCases = [],
    schemaSql = '',
    seedSql = '',
    timeLimit = 2,
    isSubmit = false
  }) {
    if (!sourceCode || !String(sourceCode).trim()) {
      return {
        passed: false,
        totalScore: 0,
        maxScore: testCases.reduce((s, tc) => s + Number(tc.marks || 1), 0),
        results: testCases.map((tc, i) => ({
          input: isSubmit && tc.isHidden ? '[hidden]' : (tc.input || ''),
          expectedOutput: isSubmit && tc.isHidden ? '[hidden]' : (tc.expectedOutput || ''),
          actualOutput: '',
          passed: false,
          marks: tc.marks || 1,
          earnedMarks: 0,
          error: 'No SQL query submitted',
          index: i
        }))
      };
    }

    const cases = testCases.length ? testCases : [{ input: '', expectedOutput: '', marks: 1 }];
    const results = [];
    let compilationError = null;

    for (let i = 0; i < cases.length; i++) {
      const tc = cases[i];
      const stdin = tc.input || '';
      const expectedOutput = tc.expectedOutput || tc.output || '';

      const execResult = await this.runCode({
        sourceCode,
        stdin,
        schemaSql,
        seedSql,
        timeLimit
      });

      if (!execResult.success && (execResult.status === 'COMPILATION_ERROR' || execResult.status === 'RUNTIME_ERROR')) {
        if (!compilationError && execResult.status === 'COMPILATION_ERROR') {
          compilationError = execResult.compileOutput || execResult.stderr;
        }

        results.push({
          input: isSubmit && tc.isHidden ? '[hidden]' : stdin,
          expectedOutput: isSubmit && tc.isHidden ? '[hidden]' : expectedOutput,
          actualOutput: isSubmit && tc.isHidden ? '[failed]' : execResult.stderr,
          passed: false,
          marks: tc.marks || 1,
          earnedMarks: 0,
          error: execResult.stderr || execResult.verdict,
          executionTime: `${Math.round(execResult.time * 1000)}ms`,
          memory: `${execResult.memory} KB`,
          index: i
        });
        continue;
      }

      const normActual = normalizeOutput(execResult.stdout);
      const normExpected = normalizeOutput(expectedOutput);

      let passed = false;
      let error = null;

      // Evaluation criteria:
      // 1. If expectedOutput is 'ANY' or empty, consider passed if query succeeded.
      // 2. Exact normalized match.
      // 3. If expectedOutput is substring of actual or keyword match (e.g. checks primary key, column name, or specific values).
      if (!normExpected || normExpected === 'ANY' || normActual === normExpected) {
        passed = true;
      } else if (normActual.toLowerCase().includes(normExpected.toLowerCase())) {
        passed = true;
      } else if (execResult.rows && execResult.rows.length > 0) {
        // Check if any row contains expected values
        const rowJson = JSON.stringify(execResult.rows).toLowerCase();
        if (rowJson.includes(normExpected.toLowerCase())) {
          passed = true;
        }
      }

      if (!passed) {
        error = 'Wrong Answer';
      }

      results.push({
        input: isSubmit && tc.isHidden ? '[hidden]' : stdin,
        expectedOutput: isSubmit && tc.isHidden ? '[hidden]' : expectedOutput,
        actualOutput: isSubmit && tc.isHidden ? (passed ? '[correct]' : '[wrong]') : normActual,
        passed,
        marks: tc.marks || 1,
        earnedMarks: passed ? (tc.marks || 1) : 0,
        executionTime: `${Math.round(execResult.time * 1000)}ms`,
        memory: `${execResult.memory} KB`,
        error,
        index: i
      });
    }

    return {
      passed: results.every(r => r.passed),
      totalScore: results.reduce((s, r) => s + r.earnedMarks, 0),
      maxScore: results.reduce((s, r) => s + r.marks, 0),
      compilationError,
      results
    };
  }

  /**
   * Return supported SQL dialect information
   */
  async getSupportedLanguages() {
    return [
      { id: 'sql', name: 'SQL (SQLite In-Memory Isolated Engine)' },
      { id: 'sqlite', name: 'SQLite 3 (Ephemeral Sandbox)' }
    ];
  }

  /**
   * Health check for SQL execution provider
   */
  async checkHealth() {
    const startTime = Date.now();
    try {
      const db = new DatabaseSync(':memory:');
      const stmt = db.prepare('SELECT 1 AS healthcheck');
      const row = stmt.get();
      db.close();

      const healthy = row?.healthcheck === 1;
      return {
        healthy,
        engine: 'SQLite 3 Isolated In-Memory Engine',
        latencyMs: Date.now() - startTime,
        details: { dialect: 'sqlite', inMemory: true, isolated: true }
      };
    } catch (err) {
      return {
        healthy: false,
        engine: 'SQLite 3 Isolated In-Memory Engine',
        latencyMs: Date.now() - startTime,
        error: err.message
      };
    }
  }
}
