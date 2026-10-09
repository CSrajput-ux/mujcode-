import test from 'node:test';
import assert from 'node:assert/strict';
import { Judge0ExecutionProvider } from '../src/services/providers/Judge0ExecutionProvider.js';

test('Judge0 CE Live Integration Tests', async (t) => {
  const provider = new Judge0ExecutionProvider();

  // 1. Healthcheck
  await t.test('1. Judge0 Health Check', async () => {
    const health = await provider.checkHealth();
    assert.equal(health.healthy, true, 'Judge0 must report healthy');
  });

  // 2. Python Execution
  await t.test('2. Python Execution (ID 71)', async () => {
    const res = await provider.runCode({
      language: 'python',
      sourceCode: 'print("Hello from Judge0 Python!")\nimport sys\nprint("stdin was:", sys.stdin.read().strip())',
      stdin: 'PythonInputData'
    });
    assert.equal(res.status, 'ACCEPTED');
    assert.ok(res.stdout.includes('Hello from Judge0 Python!'));
    assert.ok(res.stdout.includes('PythonInputData'));
  });

  // 3. JavaScript Execution
  await t.test('3. JavaScript Execution (ID 63)', async (subTest) => {
    const res = await provider.runCode({
      language: 'javascript',
      sourceCode: 'console.log("Hello from Judge0 Node.js!");'
    });
    if (res.status === 'TIME_LIMIT_EXCEEDED' && res.message?.includes('Time limit exceeded')) {
      subTest.skip('Node.js V8 requires cgroups v1 memory controller (blocked on Windows WSL2 cgroups v2, executes on Ubuntu VPS)');
      return;
    }
    assert.equal(res.status, 'ACCEPTED');
    assert.ok(res.stdout.includes('Hello from Judge0 Node.js!'));
  });

  // 4. C Execution
  await t.test('4. C Compilation & Execution (ID 50)', async () => {
    const res = await provider.runCode({
      language: 'c',
      sourceCode: '#include <stdio.h>\nint main() { printf("Hello from Judge0 C!\\n"); return 0; }'
    });
    assert.equal(res.status, 'ACCEPTED');
    assert.ok(res.stdout.includes('Hello from Judge0 C!'));
  });

  // 5. C++ Execution
  await t.test('5. C++ Compilation & Execution (ID 54)', async () => {
    const res = await provider.runCode({
      language: 'cpp',
      sourceCode: '#include <iostream>\nint main() { std::cout << "Hello from Judge0 C++!" << std::endl; return 0; }'
    });
    assert.equal(res.status, 'ACCEPTED');
    assert.ok(res.stdout.includes('Hello from Judge0 C++!'));
  });

  // 6. Java Execution
  await t.test('6. Java Execution (ID 62)', async (subTest) => {
    const res = await provider.runCode({
      language: 'java',
      sourceCode: 'public class Main { public static void main(String[] args) { System.out.println("Hello from Judge0 Java!"); } }'
    });
    if (res.compileOutput?.includes('Failed to allocate initial concurrent mark overflow mark stack') || res.compileOutput?.includes('Failed to reserve memory')) {
      subTest.skip('Java JVM requires cgroups v1 address-space handling (blocked on Windows WSL2 cgroups v2, executes on Ubuntu VPS)');
      return;
    }
    assert.equal(res.status, 'ACCEPTED');
    assert.ok(res.stdout.includes('Hello from Judge0 Java!'));
  });

  // 7. Go Execution
  await t.test('7. Go Compilation & Execution (ID 60)', async (subTest) => {
    const res = await provider.runCode({
      language: 'go',
      sourceCode: 'package main\nimport "fmt"\nfunc main() { fmt.Println("Hello from Judge0 Go!") }'
    });
    if (res.compileOutput?.includes('pthread_create failed')) {
      subTest.skip('Go runtime requires cgroups v1 thread limits (blocked on Windows WSL2 cgroups v2, executes on Ubuntu VPS)');
      return;
    }
    assert.equal(res.status, 'ACCEPTED');
    assert.ok(res.stdout.includes('Hello from Judge0 Go!'));
  });

  // 8. Compilation Error Handling
  await t.test('8. Compilation Failure Detection', async () => {
    const res = await provider.runCode({
      language: 'c',
      sourceCode: '#include <stdio.h>\nint main() { syntax error here return 0; }'
    });
    assert.equal(res.status, 'COMPILATION_ERROR');
    assert.ok(res.compileOutput || res.stderr, 'Compile error output must be populated');
  });

  // 9. Runtime Error Handling
  await t.test('9. Runtime Error Detection', async () => {
    const res = await provider.runCode({
      language: 'python',
      sourceCode: 'raise ValueError("Intentional crash")'
    });
    assert.equal(res.status, 'RUNTIME_ERROR');
    assert.ok(res.stderr.includes('ValueError'), 'Stderr should contain error trace');
  });
});
