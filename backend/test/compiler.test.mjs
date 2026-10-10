import test from 'node:test';
import assert from 'node:assert/strict';
import { CodeExecutionService, LANGUAGE_MAP } from '../src/services/CodeExecutionService.js';
import { ExecutionProviderFactory } from '../src/services/providers/ExecutionProviderFactory.js';
import { SqlExecutionProvider } from '../src/services/providers/SqlExecutionProvider.js';
import { Judge0ExecutionProvider, JUDGE0_LANGUAGE_MAP } from '../src/services/providers/Judge0ExecutionProvider.js';

test('Compiler & Execution Architecture Test Suite', async (t) => {

  // ── 1. Language Resolution and Verification ─────────────────────────────────
  await t.test('1. Seven Required Languages Resolution', async () => {
    // C
    assert.equal(CodeExecutionService.resolveLanguageId('c'), 50, 'C must resolve to ID 50');
    // C++
    assert.equal(CodeExecutionService.resolveLanguageId('cpp'), 54, 'C++ must resolve to ID 54');
    assert.equal(CodeExecutionService.resolveLanguageId('c++'), 54, 'C++ alias must resolve to ID 54');
    // Java
    assert.equal(CodeExecutionService.resolveLanguageId('java'), 62, 'Java must resolve to ID 62');
    // Python
    assert.equal(CodeExecutionService.resolveLanguageId('python'), 71, 'Python must resolve to ID 71');
    assert.equal(CodeExecutionService.resolveLanguageId('py'), 71, 'Python alias must resolve to ID 71');
    // JavaScript
    assert.equal(CodeExecutionService.resolveLanguageId('javascript'), 63, 'JavaScript must resolve to ID 63');
    assert.equal(CodeExecutionService.resolveLanguageId('js'), 63, 'JS alias must resolve to ID 63');
    // Go
    assert.equal(CodeExecutionService.resolveLanguageId('go'), 60, 'Go must resolve to ID 60');
    assert.equal(CodeExecutionService.resolveLanguageId('golang'), 60, 'Go alias must resolve to ID 60');
    // SQL
    assert.equal(CodeExecutionService.resolveLanguageId('sql'), 82, 'SQL legacy ID must be 82');

    // Direct numeric ID pass-through
    assert.equal(CodeExecutionService.resolveLanguageId(50), 50, 'Direct numeric ID 50 must pass through');

    // Unsupported language must throw
    assert.throws(
      () => CodeExecutionService.resolveLanguageId('unsupported_lang_xyz'),
      /Unsupported language/,
      'Unknown language must throw an error'
    );
  });

  // ── 2. Provider Routing and Factory ──────────────────────────────────────────
  await t.test('2. ExecutionProviderFactory Routing', async () => {
    const sqlProv = ExecutionProviderFactory.getProvider('sql');
    assert.equal(sqlProv.name, 'sql', 'SQL language must route to SqlExecutionProvider');

    const sqliteProv = ExecutionProviderFactory.getProvider('sqlite');
    assert.equal(sqliteProv.name, 'sql', 'SQLite language must route to SqlExecutionProvider');

    const pyProv = ExecutionProviderFactory.getProvider('python');
    assert.equal(pyProv.name, 'judge0', 'Python must route to Judge0ExecutionProvider');

    const cppProv = ExecutionProviderFactory.getProvider('cpp');
    assert.equal(cppProv.name, 'judge0', 'C++ must route to Judge0ExecutionProvider');

    const goProv = ExecutionProviderFactory.getProvider('go');
    assert.equal(goProv.name, 'judge0', 'Go must route to Judge0ExecutionProvider');

    const javaProv = ExecutionProviderFactory.getProvider('java');
    assert.ok(javaProv.name === 'judge0' || javaProv.name === 'local', 'Java must route to an execution provider (local or judge0)');
  });

  // ── 3. Isolated SQL Execution Engine ───────────────────────────────────────
  await t.test('3. Isolated In-Memory SQL Execution Engine', async () => {
    const sqlProvider = new SqlExecutionProvider();

    // 3.1 Basic SELECT with calculation
    const res1 = await sqlProvider.runCode({
      sourceCode: "SELECT 42 AS answer, 'hello' AS greeting;"
    });
    assert.equal(res1.success, true, 'SQL query should succeed');
    assert.equal(res1.status, 'ACCEPTED');
    assert.equal(res1.rowCount, 1);
    assert.deepEqual(res1.columns, ['answer', 'greeting']);
    assert.equal(res1.rows[0].answer, 42);
    assert.equal(res1.rows[0].greeting, 'hello');
    assert.ok(res1.stdout.includes('42'), 'Stdout should contain formatted table output');

    // 3.2 Schema + Seed + Query
    const schemaSql = 'CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, salary INT);';
    const seedSql = "INSERT INTO employees VALUES (1, 'Alice', 90000), (2, 'Bob', 80000);";
    const userQuery = 'SELECT name, salary FROM employees WHERE salary >= 85000;';

    const res2 = await sqlProvider.runCode({
      sourceCode: userQuery,
      schemaSql,
      seedSql
    });
    assert.equal(res2.success, true);
    assert.equal(res2.rowCount, 1);
    assert.equal(res2.rows[0].name, 'Alice');

    // 3.3 Ephemeral Isolation Check: Tables from previous query must NOT exist in fresh run
    const res3 = await sqlProvider.runCode({
      sourceCode: 'SELECT * FROM employees;'
    });
    assert.equal(res3.success, false, 'Previous table must not leak into fresh execution');
    assert.ok(res3.status === 'COMPILATION_ERROR' || res3.status === 'RUNTIME_ERROR');

    // 3.4 Row Limit Enforcement
    const bigSeed = Array.from({ length: 50 }, (_, i) => `(${i + 1}, 'User${i + 1}')`).join(',');
    const res4 = await sqlProvider.runCode({
      sourceCode: 'SELECT * FROM items;',
      schemaSql: 'CREATE TABLE items (id INT, name TEXT);',
      seedSql: `INSERT INTO items VALUES ${bigSeed};`,
      rowLimit: 10
    });
    assert.equal(res4.rowCount, 10, 'Row limit of 10 must be enforced');

    // 3.5 Security Enforcement: Disallow ATTACH DATABASE & dangerous pragmas
    assert.throws(
      () => SqlExecutionProvider.validateSqlSafety('ATTACH DATABASE "/etc/passwd" AS leaked;'),
      /Security Exception/,
      'ATTACH DATABASE must be blocked'
    );
    assert.throws(
      () => SqlExecutionProvider.validateSqlSafety('PRAGMA writable_schema = 1;'),
      /Security Exception/,
      'PRAGMA writable_schema must be blocked'
    );
    assert.throws(
      () => SqlExecutionProvider.validateSqlSafety('SELECT load_extension("exploit.so");'),
      /Security Exception/,
      'load_extension must be blocked'
    );

    // 3.6 SQL Health Check
    const health = await sqlProvider.checkHealth();
    assert.equal(health.healthy, true, 'SQL in-memory engine healthcheck must pass');
  });

  // ── 4. SQL Test Case Batch Evaluation ───────────────────────────────────────
  await t.test('4. SQL Test Case Evaluation', async () => {
    const sqlProvider = new SqlExecutionProvider();
    const schema = 'CREATE TABLE scores (student TEXT, score INT);';
    const seed = "INSERT INTO scores VALUES ('Alice', 95), ('Bob', 75);";

    const testCases = [
      {
        input: '',
        expectedOutput: 'Alice',
        marks: 5
      },
      {
        input: '',
        expectedOutput: '95',
        marks: 5
      }
    ];

    const result = await sqlProvider.executeTestCases({
      sourceCode: 'SELECT student, score FROM scores WHERE score > 80;',
      schemaSql: schema,
      seedSql: seed,
      testCases
    });

    assert.equal(result.passed, true, 'All SQL test cases should pass');
    assert.equal(result.totalScore, 10, 'Total score must equal 10');
    assert.equal(result.maxScore, 10, 'Max score must equal 10');
  });

  // ── 5. Status Normalization ────────────────────────────────────────────────
  await t.test('5. Status Normalization', async () => {
    const accepted = Judge0ExecutionProvider.normalizeStatus(3, 'Accepted');
    assert.equal(accepted.status, 'ACCEPTED');
    assert.equal(accepted.verdict, 'Accepted');

    const wrongAnswer = Judge0ExecutionProvider.normalizeStatus(4, 'Wrong Answer');
    assert.equal(wrongAnswer.status, 'WRONG_ANSWER');

    const tle = Judge0ExecutionProvider.normalizeStatus(5, 'Time Limit Exceeded');
    assert.equal(tle.status, 'TIME_LIMIT_EXCEEDED');

    const compError = Judge0ExecutionProvider.normalizeStatus(6, 'Compilation Error');
    assert.equal(compError.status, 'COMPILATION_ERROR');

    const runtimeError = Judge0ExecutionProvider.normalizeStatus(11, 'Runtime Error (SIGSEGV)');
    assert.equal(runtimeError.status, 'RUNTIME_ERROR');
  });

  // ── 6. Request Input Validation ────────────────────────────────────────────
  await t.test('6. Input Validation & Size Restrictions', async () => {
    // Empty source code
    await assert.rejects(
      () => CodeExecutionService.runCode({ language: 'python', sourceCode: '' }),
      /Source code cannot be empty/
    );

    await assert.rejects(
      () => CodeExecutionService.runCode({ language: 'python', sourceCode: '   ' }),
      /Source code cannot be empty/
    );

    // Large code (> 100 KB)
    const largeCode = 'a'.repeat(101 * 1024);
    await assert.rejects(
      () => CodeExecutionService.runCode({ language: 'python', sourceCode: largeCode }),
      /Source code exceeds 100 KB limit/
    );
  });

  // ── 7. Provider Health Checks ──────────────────────────────────────────────
  await t.test('7. Overall Provider Health Verification', async () => {
    const health = await CodeExecutionService.checkHealth();
    assert.ok(health.providers, 'Providers health dictionary must exist');
    assert.equal(health.providers.sql.healthy, true, 'SQL in-memory engine must report healthy');
  });
});
