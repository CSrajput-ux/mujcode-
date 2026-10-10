import test from 'node:test';
import assert from 'node:assert/strict';
import { getAdapterForLanguage } from '../src/adapters/index.js';
import { submissionQueue } from '../src/queue/SubmissionQueue.js';
import { resolveLanguage, LANGUAGES } from '../src/registry/languages.js';

test('MUJCODE Compiler Engine — 7-Language Test Matrix', async (t) => {

  // ── 1. Language Registry Verification ───────────────────────────────────────
  await t.test('1. Registry: Exactly 7 languages registered', () => {
    assert.equal(LANGUAGES.length, 7, 'Must register exactly 7 language families');
    const keys = LANGUAGES.map(l => l.key).sort();
    assert.deepEqual(keys, ['c', 'cpp', 'go', 'java', 'javascript', 'python', 'sql']);

    // Rejection of unauthorized languages
    assert.throws(() => resolveLanguage('rust'), /Unsupported language/);
    assert.throws(() => resolveLanguage('haskell'), /Unsupported language/);
    assert.throws(() => resolveLanguage('swift'), /Unsupported language/);
  });

  // ── 2. C (GCC) Matrix ───────────────────────────────────────────────────────
  await t.test('2. C (GCC): Execution Matrix', async (cTest) => {
    const adapter = getAdapterForLanguage('c');

    await cTest.test('2.1 Hello World', async () => {
      const res = await adapter.execute({
        sourceCode: '#include <stdio.h>\nint main() { printf("Hello C World\\n"); return 0; }'
      });
      assert.equal(res.status, 'ACCEPTED');
      assert.ok(res.stdout.includes('Hello C World'));
    });

    await cTest.test('2.2 Stdin & Multi-line input', async () => {
      const res = await adapter.execute({
        sourceCode: '#include <stdio.h>\nint main() { int a, b; if (scanf("%d %d", &a, &b) == 2) printf("%d", a + b); return 0; }',
        stdin: '15 25'
      });
      assert.equal(res.status, 'ACCEPTED');
      assert.equal(res.stdout.trim(), '40');
    });

    await cTest.test('2.3 Compilation Error', async () => {
      const res = await adapter.execute({
        sourceCode: '#include <stdio.h>\nint main() { syntax error here return 0; }'
      });
      assert.equal(res.status, 'COMPILATION_ERROR');
      assert.ok(res.compileOutput.length > 0);
    });

    await cTest.test('2.4 Runtime Error (Non-zero exit)', async () => {
      const res = await adapter.execute({
        sourceCode: '#include <stdlib.h>\nint main() { exit(42); }'
      });
      assert.equal(res.status, 'RUNTIME_ERROR');
      assert.equal(res.exitCode, 42);
    });

    await cTest.test('2.5 Infinite Loop Timeout Enforcement', async () => {
      const res = await adapter.execute({
        sourceCode: 'int main() { while(1); return 0; }',
        timeLimit: 1
      });
      assert.equal(res.status, 'TIME_LIMIT_EXCEEDED');
      assert.equal(res.exitCode, 124);
    });
  });

  // ── 3. C++ (G++) Matrix ─────────────────────────────────────────────────────
  await t.test('3. C++ (G++): Execution Matrix', async (cppTest) => {
    const adapter = getAdapterForLanguage('cpp');

    await cppTest.test('3.1 Hello World', async () => {
      const res = await adapter.execute({
        sourceCode: '#include <iostream>\nint main() { std::cout << "Hello C++ World" << std::endl; return 0; }'
      });
      assert.equal(res.status, 'ACCEPTED');
      assert.ok(res.stdout.includes('Hello C++ World'));
    });

    await cppTest.test('3.2 Stdin & String Processing', async () => {
      const res = await adapter.execute({
        sourceCode: '#include <iostream>\n#include <string>\nint main() { std::string s; std::cin >> s; std::cout << "Hello, " << s; return 0; }',
        stdin: 'MujCode'
      });
      assert.equal(res.status, 'ACCEPTED');
      assert.equal(res.stdout.trim(), 'Hello, MujCode');
    });

    await cppTest.test('3.3 Compilation Error', async () => {
      const res = await adapter.execute({
        sourceCode: '#include <iostream>\nint main() { std::cout << missing_variable; }'
      });
      assert.equal(res.status, 'COMPILATION_ERROR');
    });

    await cppTest.test('3.4 Infinite Loop Timeout', async () => {
      const res = await adapter.execute({
        sourceCode: 'int main() { for(;;); }',
        timeLimit: 1
      });
      assert.equal(res.status, 'TIME_LIMIT_EXCEEDED');
    });
  });

  // ── 4. Java (OpenJDK) Matrix ────────────────────────────────────────────────
  await t.test('4. Java (OpenJDK): Execution Matrix', async (javaTest) => {
    const adapter = getAdapterForLanguage('java');

    await javaTest.test('4.1 Hello World with public class Main', async () => {
      const res = await adapter.execute({
        sourceCode: 'public class Main { public static void main(String[] args) { System.out.println("Hello Java World"); } }'
      });
      assert.equal(res.status, 'ACCEPTED');
      assert.ok(res.stdout.includes('Hello Java World'));
    });

    await javaTest.test('4.2 Stdin with custom Solution class', async () => {
      const res = await adapter.execute({
        sourceCode: 'import java.util.Scanner;\nclass Solution { public static void main(String[] args) { Scanner sc = new Scanner(System.in); int x = sc.nextInt(); System.out.println(x * 10); } }',
        stdin: '7'
      });
      assert.equal(res.status, 'ACCEPTED');
      assert.equal(res.stdout.trim(), '70');
    });

    await javaTest.test('4.3 Syntax / Compile Error', async () => {
      const res = await adapter.execute({
        sourceCode: 'public class Main { public static void main(String[] args) { error } }'
      });
      assert.equal(res.status, 'COMPILATION_ERROR');
    });

    await javaTest.test('4.4 Runtime Exception (ArithmeticException)', async () => {
      const res = await adapter.execute({
        sourceCode: 'public class Main { public static void main(String[] args) { int x = 10 / 0; } }'
      });
      assert.equal(res.status, 'RUNTIME_ERROR');
      assert.ok(res.stderr.includes('ArithmeticException'));
    });
  });

  // ── 5. Python 3 Matrix ──────────────────────────────────────────────────────
  await t.test('5. Python 3: Execution Matrix', async (pyTest) => {
    const adapter = getAdapterForLanguage('python');

    await pyTest.test('5.1 Hello World & Unicode Output', async () => {
      const res = await adapter.execute({
        sourceCode: 'print("Hello Python 🐍")'
      });
      assert.equal(res.status, 'ACCEPTED');
      assert.ok(res.stdout.includes('Hello Python 🐍'));
    });

    await pyTest.test('5.2 Stdin Multi-line Sum', async () => {
      const res = await adapter.execute({
        sourceCode: 'import sys\nnums = [int(x) for x in sys.stdin.read().split()]\nprint(sum(nums))',
        stdin: '10\n20\n30\n'
      });
      assert.equal(res.status, 'ACCEPTED');
      assert.equal(res.stdout.trim(), '60');
    });

    await pyTest.test('5.3 Runtime Exception (ZeroDivisionError)', async () => {
      const res = await adapter.execute({
        sourceCode: 'x = 1 / 0'
      });
      assert.equal(res.status, 'RUNTIME_ERROR');
      assert.ok(res.stderr.includes('ZeroDivisionError'));
    });

    await pyTest.test('5.4 Infinite Loop Timeout', async () => {
      const res = await adapter.execute({
        sourceCode: 'while True: pass',
        timeLimit: 1
      });
      assert.equal(res.status, 'TIME_LIMIT_EXCEEDED');
    });
  });

  // ── 6. JavaScript (Node.js) Matrix ──────────────────────────────────────────
  await t.test('6. JavaScript (Node.js): Execution Matrix', async (jsTest) => {
    const adapter = getAdapterForLanguage('javascript');

    await jsTest.test('6.1 Hello World & JSON Output', async () => {
      const res = await adapter.execute({
        sourceCode: 'console.log(JSON.stringify({ message: "Hello Node" }));'
      });
      assert.equal(res.status, 'ACCEPTED');
      assert.ok(res.stdout.includes('"message":"Hello Node"'));
    });

    await jsTest.test('6.2 Stdin Streaming', async () => {
      const res = await adapter.execute({
        sourceCode: 'const fs = require("fs"); const input = fs.readFileSync(0, "utf-8").trim(); console.log(input.toUpperCase());',
        stdin: 'mujcode'
      });
      assert.equal(res.status, 'ACCEPTED');
      assert.equal(res.stdout.trim(), 'MUJCODE');
    });

    await jsTest.test('6.3 Runtime Error (ReferenceError)', async () => {
      const res = await adapter.execute({
        sourceCode: 'nonExistentFunction();'
      });
      assert.equal(res.status, 'RUNTIME_ERROR');
      assert.ok(res.stderr.includes('ReferenceError'));
    });
  });

  // ── 7. SQL (Isolated Engine) Matrix ────────────────────────────────────────
  await t.test('7. SQL: Comprehensive Isolation Matrix', async (sqlTest) => {
    const adapter = getAdapterForLanguage('sql');

    await sqlTest.test('7.1 Basic SELECT with Calculations', async () => {
      const res = await adapter.execute({
        sourceCode: "SELECT 10 + 20 AS total, 'MUJ' AS campus;"
      });
      assert.equal(res.status, 'ACCEPTED');
      assert.equal(res.rowCount, 1);
      assert.equal(res.rows[0].total, 30);
      assert.equal(res.rows[0].campus, 'MUJ');
    });

    await sqlTest.test('7.2 Schema + Seed + WHERE + ORDER BY', async () => {
      const schemaSql = 'CREATE TABLE students (id INT PRIMARY KEY, name TEXT, gpa REAL);';
      const seedSql = "INSERT INTO students VALUES (1, 'Kavya', 9.2), (2, 'Rahul', 8.4), (3, 'Ananya', 9.6);";
      const userQuery = 'SELECT name, gpa FROM students WHERE gpa >= 9.0 ORDER BY gpa DESC;';

      const res = await adapter.execute({
        sourceCode: userQuery,
        schemaSql,
        seedSql
      });

      assert.equal(res.status, 'ACCEPTED');
      assert.equal(res.rowCount, 2);
      assert.equal(res.rows[0].name, 'Ananya');
      assert.equal(res.rows[1].name, 'Kavya');
    });

    await sqlTest.test('7.3 Ephemeral State Isolation: Tables do not leak', async () => {
      const res = await adapter.execute({
        sourceCode: 'SELECT * FROM students;'
      });
      assert.equal(res.status, 'RUNTIME_ERROR');
      assert.ok(res.stderr.includes('no such table: students'));
    });

    await sqlTest.test('7.4 Security Guard: Reject ATTACH DATABASE', async () => {
      const res = await adapter.execute({
        sourceCode: 'ATTACH DATABASE "/etc/shadow" AS stolen;'
      });
      assert.equal(res.status, 'RUNTIME_ERROR');
      assert.ok(res.stderr.includes('Security Exception'));
    });

    await sqlTest.test('7.5 Row Limit Bounding', async () => {
      const values = Array.from({ length: 50 }, (_, i) => `(${i + 1})`).join(',');
      const res = await adapter.execute({
        sourceCode: 'SELECT * FROM numbers;',
        schemaSql: 'CREATE TABLE numbers (n INT);',
        seedSql: `INSERT INTO numbers VALUES ${values};`,
        rowLimit: 5
      });
      assert.equal(res.status, 'ACCEPTED');
      assert.equal(res.rowCount, 5);
    });
  });

  // ── 8. Go (Golang) Matrix ───────────────────────────────────────────────────
  await t.test('8. Go (Golang): Compilation & Execution', async (goTest) => {
    const adapter = getAdapterForLanguage('go');

    const res = await adapter.execute({
      sourceCode: 'package main\nimport "fmt"\nfunc main() {\n\tfmt.Println("Hello Go World")\n}'
    });

    if (res.stderr?.includes('ENOENT') || res.compileOutput?.includes('ENOENT')) {
      goTest.skip('Go binary not available on host; verified in container');
      return;
    }
    assert.equal(res.status, 'ACCEPTED');
    assert.ok(res.stdout.includes('Hello Go World'));
  });

  // ── 9. SubmissionQueue & Concurrency ────────────────────────────────────────
  await t.test('9. Queue: Concurrent Submission Dispatching', async () => {
    const j1 = submissionQueue.enqueue({ languageId: 'python', sourceCode: 'print(1)' });
    const j2 = submissionQueue.enqueue({ languageId: 'python', sourceCode: 'print(2)' });
    const j3 = submissionQueue.enqueue({ languageId: 'python', sourceCode: 'print(3)' });

    assert.ok(j1.token);
    assert.ok(j2.token);
    assert.ok(j3.token);

    // Poll until all three finish
    const start = Date.now();
    while ((j1.statusId < 3 || j2.statusId < 3 || j3.statusId < 3) && Date.now() - start < 10000) {
      await new Promise(r => setTimeout(r, 100));
    }

    assert.equal(j1.status, 'ACCEPTED');
    assert.equal(j1.stdout.trim(), '1');
    assert.equal(j2.status, 'ACCEPTED');
    assert.equal(j2.stdout.trim(), '2');
    assert.equal(j3.status, 'ACCEPTED');
    assert.equal(j3.stdout.trim(), '3');
  });
});
