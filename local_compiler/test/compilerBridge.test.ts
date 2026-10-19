/**
 * MUJCODE Local Compiler — Automated Test Suite
 * 
 * Verifies language registry, runtime doctor diagnostics, missing dependency handlers,
 * execution timeouts, output truncation, stdin piping, and actual execution of available compilers.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SUPPORTED_LANGUAGES, resolveLanguage } from '../dist/compiler/registry.js';
import { runtimeDoctor } from '../dist/services/runtimeDoctor.js';
import { adapterBridge } from '../dist/compiler/adapterBridge.js';

describe('1. Language Registry & Validation', () => {
  it('should register strictly all seven approved language families', () => {
    const expectedIds = [50, 54, 62, 71, 63, 60, 82];
    const registeredIds = SUPPORTED_LANGUAGES.map((l) => l.id);
    assert.deepStrictEqual(registeredIds, expectedIds);
  });

  it('should resolve language by ID, key, and aliases', () => {
    assert.strictEqual(resolveLanguage(71).key, 'python');
    assert.strictEqual(resolveLanguage('py').key, 'python');
    assert.strictEqual(resolveLanguage('cpp').id, 54);
    assert.strictEqual(resolveLanguage('c++').id, 54);
    assert.strictEqual(resolveLanguage('sql').id, 82);
    assert.strictEqual(resolveLanguage(63).key, 'javascript');
  });

  it('should reject unsupported language IDs with clear descriptive message', () => {
    assert.throws(
      () => resolveLanguage('ruby'),
      /Unsupported language identifier: "ruby"/
    );
    assert.throws(
      () => resolveLanguage(999),
      /Unsupported language identifier: "999"/
    );
  });
});

describe('2. Input Validation & Edge Cases', () => {
  it('should reject empty or whitespace source code as COMPILATION_ERROR', async () => {
    const res = await adapterBridge.executeCode({
      requestId: 'test_empty_1',
      language: 'python',
      sourceCode: '   \n  \t  '
    });
    assert.strictEqual(res.status, 'COMPILATION_ERROR');
    assert.match(res.stderr, /cannot be empty/i);
  });

  it('should reject oversized source code exceeding 100 KB limit', async () => {
    const hugeCode = 'x = 1\n'.repeat(25000); // > 100 KB
    const res = await adapterBridge.executeCode({
      requestId: 'test_oversize_1',
      language: 'python',
      sourceCode: hugeCode
    });
    assert.strictEqual(res.status, 'INTERNAL_ERROR');
    assert.strictEqual(res.errorCode, 'VALIDATION_FAILED');
    assert.match(res.stderr, /exceeds maximum allowed size of 100 KB/i);
  });
});

describe('3. Runtime Doctor & Missing Dependency Handling', () => {
  it('should accurately detect that Go is MISSING on the host Windows machine', async () => {
    const diag = await runtimeDoctor.getDiagnosticForLanguage('go');
    assert.strictEqual(diag.available, false);
    assert.strictEqual(diag.executablePath, null);
    assert.match(diag.troubleshootingInstructions || '', /Install Go/i);
  });

  it('should return DEPENDENCY_MISSING when attempting to run Go without installing it', async () => {
    const res = await adapterBridge.executeCode({
      requestId: 'test_go_missing',
      language: 'go',
      sourceCode: `package main\nimport "fmt"\nfunc main() { fmt.Println("test") }`
    });
    assert.strictEqual(res.status, 'DEPENDENCY_MISSING');
    assert.strictEqual(res.verdict, 'Dependency Missing');
    assert.strictEqual(res.exitCode, 127);
    assert.match(res.stderr, /Required runtime "Go Compiler \(Golang\)" is not installed/i);
  });

  it('should verify SQL support through in-process SQLite WebAssembly engine', async () => {
    const diag = await runtimeDoctor.getDiagnosticForLanguage('sql');
    assert.strictEqual(diag.available, true);
    assert.strictEqual(diag.languageId, 82);
  });
});

describe('4. Real Execution of Supported Languages', () => {
  it('should execute Python successfully with stdout capture', async () => {
    const res = await adapterBridge.executeCode({
      requestId: 'test_py_run',
      language: 'python',
      sourceCode: 'print(40 + 2)'
    });
    assert.strictEqual(res.status, 'SUCCESS');
    assert.strictEqual(res.verdict, 'Accepted');
    assert.strictEqual(res.stdout.trim(), '42');
    assert.strictEqual(res.exitCode, 0);
  });

  it('should pipe standard input to Python correctly', async () => {
    const res = await adapterBridge.executeCode({
      requestId: 'test_py_stdin',
      language: 'python',
      sourceCode: 'import sys\nname = sys.stdin.read().strip()\nprint(f"Hello, {name}!")',
      stdin: 'Antigravity'
    });
    assert.strictEqual(res.status, 'SUCCESS');
    assert.strictEqual(res.stdout.trim(), 'Hello, Antigravity!');
  });

  it('should capture Python runtime errors accurately', async () => {
    const res = await adapterBridge.executeCode({
      requestId: 'test_py_err',
      language: 'python',
      sourceCode: 'x = 1 / 0'
    });
    assert.strictEqual(res.status, 'RUNTIME_ERROR');
    assert.strictEqual(res.verdict, 'Runtime Error');
    assert.match(res.stderr, /ZeroDivisionError/);
    assert.notStrictEqual(res.exitCode, 0);
  });

  it('should execute JavaScript successfully in bounded Node runtime', async () => {
    const res = await adapterBridge.executeCode({
      requestId: 'test_js_run',
      language: 'javascript',
      sourceCode: 'const nums = [1, 2, 3, 4]; console.log(nums.reduce((a, b) => a + b, 0));'
    });
    assert.strictEqual(res.status, 'SUCCESS');
    assert.strictEqual(res.stdout.trim(), '10');
  });

  it('should execute SQL in-memory queries with table formatting and safety checks', async () => {
    const res = await adapterBridge.executeCode({
      requestId: 'test_sql_run',
      language: 'sql',
      sourceCode: "CREATE TABLE scores (student TEXT, score INT); INSERT INTO scores VALUES ('Rahul', 95); SELECT * FROM scores;"
    });
    assert.strictEqual(res.status, 'SUCCESS');
    assert.strictEqual(res.rowCount, 1);
    assert.match(res.stdout, /Rahul/);
    assert.match(res.stdout, /95/);
  });

  it('should execute SELECT 1 + 1 AS result returning 2', async () => {
    const res = await adapterBridge.executeCode({
      requestId: 'test_sql_math',
      language: 'sql',
      sourceCode: 'SELECT 1 + 1 AS result;'
    });
    assert.strictEqual(res.status, 'SUCCESS');
    assert.strictEqual(res.rowCount, 1);
    assert.match(res.stdout, /result/);
    assert.match(res.stdout, /2/);
    assert.strictEqual(res.rows[0].result, 2);
  });

  it('should reject forbidden SQL statements with runtime security exception', async () => {
    const res = await adapterBridge.executeCode({
      requestId: 'test_sql_exploit',
      language: 'sql',
      sourceCode: 'ATTACH DATABASE "malicious.db" AS stolen;'
    });
    assert.strictEqual(res.status, 'RUNTIME_ERROR');
    assert.match(res.stderr, /Security Exception: Disallowed SQL pattern/i);
  });

  it('should execute C code if GCC is installed on host', async () => {
    const diag = await runtimeDoctor.getDiagnosticForLanguage('c');
    if (!diag.available) {
      return; // gracefully skip if not installed
    }

    const res = await adapterBridge.executeCode({
      requestId: 'test_c_run',
      language: 'c',
      sourceCode: '#include <stdio.h>\nint main() { printf("C_OK\\n"); return 0; }'
    });
    assert.strictEqual(res.status, 'SUCCESS');
    assert.strictEqual(res.stdout.trim(), 'C_OK');
  });

  it('should return COMPILATION_ERROR for invalid C code', async () => {
    const diag = await runtimeDoctor.getDiagnosticForLanguage('c');
    if (!diag.available) return;

    const res = await adapterBridge.executeCode({
      requestId: 'test_c_compile_err',
      language: 'c',
      sourceCode: 'int main() { this is completely invalid syntax; }'
    });
    assert.strictEqual(res.status, 'COMPILATION_ERROR');
    assert.strictEqual(res.verdict, 'Compilation Error');
    assert.match(res.compileError || res.stderr, /error:/i);
  });

  it('should execute C++ code if G++ is installed on host', async () => {
    const diag = await runtimeDoctor.getDiagnosticForLanguage('cpp');
    if (!diag.available) return;

    const res = await adapterBridge.executeCode({
      requestId: 'test_cpp_run',
      language: 'cpp',
      sourceCode: '#include <iostream>\nint main() { std::cout << "CPP_OK" << std::endl; return 0; }'
    });
    assert.strictEqual(res.status, 'SUCCESS');
    assert.strictEqual(res.stdout.trim(), 'CPP_OK');
  });

  it('should execute Java code if OpenJDK is installed on host', async () => {
    const diag = await runtimeDoctor.getDiagnosticForLanguage('java');
    if (!diag.available) return;

    const res = await adapterBridge.executeCode({
      requestId: 'test_java_run',
      language: 'java',
      sourceCode: 'public class Main { public static void main(String[] args) { System.out.println("JAVA_OK"); } }'
    });
    assert.strictEqual(res.status, 'SUCCESS');
    assert.strictEqual(res.stdout.trim(), 'JAVA_OK');
  });
});

describe('5. Timeouts, Process Cleanup & Bounded Output', () => {
  it('should enforce execution timeout and terminate infinite loops', async () => {
    const startTime = Date.now();
    const res = await adapterBridge.executeCode({
      requestId: 'test_py_timeout',
      language: 'python',
      sourceCode: 'while True:\n    pass',
      timeLimitMs: 1500
    });
    const duration = Date.now() - startTime;

    assert.strictEqual(res.status, 'TIME_LIMIT_EXCEEDED');
    assert.strictEqual(res.verdict, 'Time Limit Exceeded');
    assert.strictEqual(res.exitCode, 124);
    assert(duration >= 1400 && duration <= 4000, `Duration ${duration}ms outside expected bound`);
  });

  it('should truncate output exceeding 256 KB buffer limit', async () => {
    const res = await adapterBridge.executeCode({
      requestId: 'test_py_flood',
      language: 'python',
      sourceCode: 'for _ in range(20000):\n    print("FloodLineData-0123456789ABCDEF")'
    });
    assert.strictEqual(res.truncated, true);
    assert.match(res.stdout, /\[Output truncated: Limit of 256 KB exceeded\]/);
  });

  it('should clean up temporary workspace directory after execution', async () => {
    const workBase = path.join(os.tmpdir(), 'mujbox');
    const beforeCount = fs.existsSync(workBase) ? fs.readdirSync(workBase).length : 0;

    await adapterBridge.executeCode({
      requestId: 'test_cleanup_verify',
      language: 'python',
      sourceCode: 'print("clean")'
    });

    const afterCount = fs.existsSync(workBase) ? fs.readdirSync(workBase).length : 0;
    assert.strictEqual(afterCount, beforeCount, 'Temporary job folder was left behind!');
  });
});
