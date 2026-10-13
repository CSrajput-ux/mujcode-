import test from 'node:test';
import assert from 'node:assert/strict';

const ENGINE_URL = process.env.COMPILER_ENGINE_URL || 'http://127.0.0.1:2359';

test('MUJCODE Compiler Engine — Live Integration Test Suite (7 Languages)', async (t) => {
  // Check if live engine is running
  try {
    const probe = await fetch(`${ENGINE_URL}/health`, { signal: AbortSignal.timeout(1500) });
    if (!probe.ok) {
      t.skip(`Compiler Engine health check failed (${probe.status}). Start engine before running live tests.`);
      return;
    }
  } catch {
    t.skip(`Compiler Engine is offline at ${ENGINE_URL}. Start it with 'npm run dev:compiler' for live integration testing.`);
    return;
  }

  // ── 1. Healthcheck ──────────────────────────────────────────────────────────
  await t.test('1. Engine Health Check', async () => {
    const res = await fetch(`${ENGINE_URL}/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'ok');
    assert.equal(data.service, 'mujcode-compiler-engine');
  });

  // ── 2. Languages Registry Verification ──────────────────────────────────────
  await t.test('2. Languages Endpoint lists strictly 7 languages', async () => {
    const res = await fetch(`${ENGINE_URL}/languages`);
    assert.equal(res.status, 200);
    const langs = await res.json();
    assert.equal(langs.length, 7);
    const ids = langs.map(l => l.id).sort((a, b) => a - b);
    assert.deepEqual(ids, [50, 54, 60, 62, 63, 71, 82]);
  });

  // ── 3. Helper for submitting & polling ──────────────────────────────────────
  async function submitAndPoll({ languageId, sourceCode, stdin = '' }) {
    const postRes = await fetch(`${ENGINE_URL}/submissions?base64_encoded=true&wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language_id: languageId,
        source_code: Buffer.from(sourceCode, 'utf8').toString('base64'),
        stdin: Buffer.from(stdin, 'utf8').toString('base64')
      })
    });
    assert.equal(postRes.status, 201);
    const data = await postRes.json();
    return {
      statusId: data.status_id,
      status: data.status?.description,
      stdout: data.stdout ? Buffer.from(data.stdout, 'base64').toString('utf8') : '',
      stderr: data.stderr ? Buffer.from(data.stderr, 'base64').toString('utf8') : '',
      compileOutput: data.compile_output ? Buffer.from(data.compile_output, 'base64').toString('utf8') : ''
    };
  }

  // ── 4. Language Executions ──────────────────────────────────────────────────
  await t.test('3. C (ID 50) Execution', async () => {
    const res = await submitAndPoll({
      languageId: 50,
      sourceCode: '#include <stdio.h>\nint main() { printf("Hello from C\\n"); return 0; }'
    });
    assert.equal(res.statusId, 3);
    assert.ok(res.stdout.includes('Hello from C'));
  });

  await t.test('4. C++ (ID 54) Execution', async () => {
    const res = await submitAndPoll({
      languageId: 54,
      sourceCode: '#include <iostream>\nint main() { std::cout << "Hello from C++" << std::endl; return 0; }'
    });
    assert.equal(res.statusId, 3);
    assert.ok(res.stdout.includes('Hello from C++'));
  });

  await t.test('5. Java (ID 62) Execution (No heap errors)', async () => {
    const res = await submitAndPoll({
      languageId: 62,
      sourceCode: 'public class Main { public static void main(String[] args) { System.out.println("Hello from Java"); } }'
    });
    assert.equal(res.statusId, 3);
    assert.ok(res.stdout.includes('Hello from Java'));
  });

  await t.test('6. Python (ID 71) Execution', async () => {
    const res = await submitAndPoll({
      languageId: 71,
      sourceCode: 'print("Hello from Python 🐍")'
    });
    assert.equal(res.statusId, 3);
    assert.ok(res.stdout.includes('Hello from Python 🐍'));
  });

  await t.test('7. JavaScript (ID 63) Execution', async () => {
    const res = await submitAndPoll({
      languageId: 63,
      sourceCode: 'console.log("Hello from JavaScript");'
    });
    assert.equal(res.statusId, 3);
    assert.ok(res.stdout.includes('Hello from JavaScript'));
  });

  await t.test('8. Go (ID 60) Execution', async () => {
    const res = await submitAndPoll({
      languageId: 60,
      sourceCode: 'package main\nimport "fmt"\nfunc main() {\n\tfmt.Println("Hello from Go")\n}\n'
    });
    assert.equal(res.statusId, 3);
    assert.ok(res.stdout.includes('Hello from Go'));
  });

  await t.test('9. SQL (ID 82) Execution', async () => {
    const res = await submitAndPoll({
      languageId: 82,
      sourceCode: "SELECT 'MUJCODE' AS engine, 100 AS score;"
    });
    assert.equal(res.statusId, 3);
    assert.ok(res.stdout.includes('MUJCODE'));
  });

  // ── 5. Error Detection Matrix ───────────────────────────────────────────────
  await t.test('10. Compilation Failure Detection', async () => {
    const res = await submitAndPoll({
      languageId: 50,
      sourceCode: '#include <stdio.h>\nint main() { syntax error here return 0; }'
    });
    assert.equal(res.statusId, 6);
    assert.ok(res.compileOutput.length > 0);
  });

  await t.test('11. Runtime Error Detection', async () => {
    const res = await submitAndPoll({
      languageId: 71,
      sourceCode: 'x = 1 / 0'
    });
    assert.equal(res.statusId, 11);
    assert.ok(res.stderr.includes('ZeroDivisionError'));
  });
});
