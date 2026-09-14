import assert from 'node:assert';
import { CodeExecutionService } from './src/services/CodeExecutionService.js';
import { Judge0Service } from './src/services/Judge0Service.js';

console.log('🧪 Starting Judge0 & Code Execution Unit/Integration Tests...\n');

let testsPassed = 0;
let testsFailed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ ${name}:`, err.message);
    testsFailed++;
  }
}

// ── Test 1: Language Resolver ────────────────────────────────────────────────
await test('Language resolution maps supported languages correctly', () => {
  assert.strictEqual(CodeExecutionService.resolveLanguageId('python'), 71);
  assert.strictEqual(CodeExecutionService.resolveLanguageId('Python3'), 71);
  assert.strictEqual(CodeExecutionService.resolveLanguageId('py'), 71);
  assert.strictEqual(CodeExecutionService.resolveLanguageId('javascript'), 63);
  assert.strictEqual(CodeExecutionService.resolveLanguageId('node'), 63);
  assert.strictEqual(CodeExecutionService.resolveLanguageId('java'), 62);
  assert.strictEqual(CodeExecutionService.resolveLanguageId('c'), 50);
  assert.strictEqual(CodeExecutionService.resolveLanguageId('cpp'), 54);
  assert.strictEqual(CodeExecutionService.resolveLanguageId('c++'), 54);
  assert.strictEqual(CodeExecutionService.resolveLanguageId('go'), 60);
  assert.strictEqual(CodeExecutionService.resolveLanguageId('rust'), 73);
  assert.strictEqual(CodeExecutionService.resolveLanguageId('csharp'), 51);
  assert.strictEqual(CodeExecutionService.resolveLanguageId('php'), 68);
});

// ── Test 2: Invalid Language Rejection ──────────────────────────────────────
await test('Language resolution rejects invalid/unknown language', () => {
  assert.throws(() => {
    CodeExecutionService.resolveLanguageId('brainfuck');
  }, /Unsupported or unmapped language/);
});

// ── Test 3: Status Normalization ─────────────────────────────────────────────
await test('Status normalization maps Judge0 status IDs to application verdicts', () => {
  assert.deepStrictEqual(CodeExecutionService.normalizeStatus(3, 'Accepted'), {
    status: 'ACCEPTED',
    verdict: 'Accepted'
  });
  assert.deepStrictEqual(CodeExecutionService.normalizeStatus(4, 'Wrong Answer'), {
    status: 'WRONG_ANSWER',
    verdict: 'Wrong Answer'
  });
  assert.deepStrictEqual(CodeExecutionService.normalizeStatus(5, 'Time Limit Exceeded'), {
    status: 'TIME_LIMIT_EXCEEDED',
    verdict: 'Time Limit Exceeded'
  });
  assert.deepStrictEqual(CodeExecutionService.normalizeStatus(6, 'Compilation Error'), {
    status: 'COMPILATION_ERROR',
    verdict: 'Compilation Error'
  });
  assert.deepStrictEqual(CodeExecutionService.normalizeStatus(11, 'Runtime Error (NZEC)'), {
    status: 'RUNTIME_ERROR',
    verdict: 'Runtime Error'
  });
  assert.deepStrictEqual(CodeExecutionService.normalizeStatus(13, 'Internal Error'), {
    status: 'INTERNAL_ERROR',
    verdict: 'Internal Error'
  });
});

// ── Test 4: Rate Limiting ────────────────────────────────────────────────────
await test('Rate limiter enforces quotas for anonymous and authenticated users', () => {
  const testAnonUser = `test_anon_${Date.now()}`;
  for (let i = 0; i < 5; i++) {
    assert.strictEqual(CodeExecutionService.checkRateLimit(testAnonUser, false), true);
  }
  assert.throws(() => {
    CodeExecutionService.checkRateLimit(testAnonUser, false);
  }, /Rate limit exceeded/);

  const testAuthUser = `test_auth_${Date.now()}`;
  for (let i = 0; i < 20; i++) {
    assert.strictEqual(CodeExecutionService.checkRateLimit(testAuthUser, true), true);
  }
  assert.throws(() => {
    CodeExecutionService.checkRateLimit(testAuthUser, true);
  }, /Rate limit exceeded/);
});

// ── Test 5: Source Code Size Guards ──────────────────────────────────────────
await test('CodeExecutionService rejects code exceeding 100 KB limit', async () => {
  const largeCode = 'a'.repeat(101 * 1024);
  await assert.rejects(async () => {
    await CodeExecutionService.runCode({
      language: 'python',
      sourceCode: largeCode
    });
  }, /exceeds maximum size limit of 100 KB/);
});

// ── Test 6: Empty Source Code Guards ─────────────────────────────────────────
await test('CodeExecutionService rejects empty source code', async () => {
  await assert.rejects(async () => {
    await CodeExecutionService.runCode({
      language: 'python',
      sourceCode: '   '
    });
  }, /Source code cannot be empty/);
});

// ── Test 7: Hidden Test Cases Security ───────────────────────────────────────
await test('executeTestCases masks hidden test cases from client in submit mode', async () => {
  const testCases = [
    { input: '1 2', expectedOutput: '3', marks: 5, isHidden: false },
    { input: '99 1', expectedOutput: '100', marks: 10, isHidden: true }
  ];

  // Empty code test to inspect hidden masking
  const result = await CodeExecutionService.executeTestCases({
    language: 'python',
    sourceCode: '',
    testCases,
    isSubmit: true
  });

  assert.strictEqual(result.results[0].input, '1 2');
  assert.strictEqual(result.results[0].expectedOutput, '3');
  assert.strictEqual(result.results[1].input, '[hidden]', 'Hidden input must be masked');
  assert.strictEqual(result.results[1].expectedOutput, '[hidden]', 'Hidden expectedOutput must be masked');
});

// ── Test 8: Judge0 Health Check ──────────────────────────────────────────────
await test('Judge0Service.checkHealth returns status object with latency', async () => {
  const health = await Judge0Service.checkHealth();
  assert.strictEqual(typeof health.healthy, 'boolean');
  assert.strictEqual(typeof health.latencyMs, 'number');
  if (!health.healthy) {
    console.log(`     ℹ️ Note: Judge0 daemon is currently offline at ${Judge0Service.config?.judge0Url || 'http://localhost:2358'} (Expected in test environment without Docker container active).`);
  }
});

console.log(`\n📊 Test Summary: ${testsPassed} passed, ${testsFailed} failed.`);
if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('🎉 All core Judge0 integration tests PASSED successfully!\n');
}
