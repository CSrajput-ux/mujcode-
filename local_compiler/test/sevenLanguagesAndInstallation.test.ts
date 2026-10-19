import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runtimeDoctor } from '../dist/services/runtimeDoctor.js';
import { PythonAdapter } from '../dist/compiler/adapters/PythonAdapter.js';
import { adapterBridge } from '../dist/compiler/adapterBridge.js';

describe('7-Language Setup & Windows Executable Resolution Tests', () => {
  it('should diagnose all 7 supported language runtimes with structured reports', async () => {
    const diagnostics = await runtimeDoctor.diagnoseAll();
    assert.strictEqual(diagnostics.length, 7, 'Must report on exactly 7 languages');

    const expectedLangs = ['c', 'cpp', 'java', 'python', 'javascript', 'go', 'sql'];
    for (const lang of expectedLangs) {
      const diag = diagnostics.find((d) => d.languageKey === lang);
      assert.ok(diag, `Diagnostic report must include language: ${lang}`);
      assert.strictEqual(typeof diag.available, 'boolean');
      assert.strictEqual(typeof diag.runtimeName, 'string');
      assert.ok(diag.languageId > 0);

      // Verify smoke test field exists
      assert.strictEqual(typeof diag.smokeTestPassed, 'boolean');

      // Verify winget package metadata
      assert.ok(diag.wingetId || diag.isBundled, `Language ${lang} should have wingetId or be bundled`);
    }
  });

  it('should distinguish bundled SQLite/WASM from missing sqlite3 executable', async () => {
    const sqlDiag = await runtimeDoctor.getDiagnosticForLanguage('sql');
    assert.strictEqual(sqlDiag.available, true, 'SQL must be reported as available via bundled sql.js WASM');
    assert.strictEqual(sqlDiag.isBundled, true, 'SQL runtime must be flagged as bundled');
    assert.strictEqual(sqlDiag.smokeTestPassed, true, 'SQL safe smoke test should pass');
    assert.match(sqlDiag.detectedVersion || '', /WebAssembly/i);
  });

  it('should reject unapproved package IDs in installToolchainViaWinget', async () => {
    const maliciousAttempt = await runtimeDoctor.installToolchainViaWinget('Malicious.Package.123');
    assert.strictEqual(maliciousAttempt.success, false);
    assert.match(maliciousAttempt.output, /allowlist/i);
  });

  it('should trap ENOENT in PythonAdapter and return structured DEPENDENCY_MISSING', async () => {
    // Instantiate adapter with non-existent python binary to simulate missing python on Windows
    const adapter = new PythonAdapter();
    const result = await adapter.execute({
      requestId: 'simulated_enoent_test',
      language: 'python',
      sourceCode: 'print("Hello World")',
      runtimeExecutableOverride: '__non_existent_python_binary_99999__.exe'
    });

    assert.strictEqual(result.status, 'DEPENDENCY_MISSING');
    assert.strictEqual(result.verdict, 'Dependency Missing');
    assert.strictEqual(result.errorCode, 'RUNTIME_NOT_FOUND');
    assert.match(result.stderr, /Python 3 runtime was not found or could not be launched/i);
    assert.match(result.stderr, /winget install Python\.Python\.3\.12/i);
  });

  it('should ensure missing language runtime does not break other installed languages', async () => {
    // SQL (bundled) works
    const sqlResult = await adapterBridge.executeCode({
      requestId: 'test_sql_isolation',
      language: 'sql',
      sourceCode: 'SELECT 42 AS answer;'
    });
    assert.strictEqual(sqlResult.status, 'SUCCESS');
    assert.match(sqlResult.stdout, /42/);

    // JavaScript (Node) works
    const jsResult = await adapterBridge.executeCode({
      requestId: 'test_js_isolation',
      language: 'javascript',
      sourceCode: 'console.log("Isolated JS Execution OK");'
    });
    assert.strictEqual(jsResult.status, 'SUCCESS');
    assert.match(jsResult.stdout, /Isolated JS Execution OK/);

    // Missing Go returns DEPENDENCY_MISSING without crashing
    const goResult = await adapterBridge.executeCode({
      requestId: 'test_go_missing',
      language: 'go',
      sourceCode: 'package main\nfunc main() {}'
    });
    assert.strictEqual(goResult.status, 'DEPENDENCY_MISSING');
    assert.strictEqual(goResult.verdict, 'Dependency Missing');
  });
});
