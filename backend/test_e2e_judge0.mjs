import http from 'node:http';
import assert from 'node:assert';
import { config } from './src/config.js';
import { CodeExecutionService } from './src/services/CodeExecutionService.js';
import { Judge0Service } from './src/services/Judge0Service.js';

console.log('🚀 Running End-to-End Judge0 Mock Verification Suite...\n');

// Configure test port
const TEST_PORT = 2359;
config.judge0Url = `http://localhost:${TEST_PORT}`;

// In-memory mock submissions store
const mockSubmissions = new Map();

// Create Mock Judge0 HTTP Server
const mockServer = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${TEST_PORT}`);
  
  if (req.method === 'POST' && url.pathname === '/submissions') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const payload = JSON.parse(body);
      const token = `sub_tok_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      
      const sourceCode = Buffer.from(payload.source_code || '', 'base64').toString('utf-8');
      const stdin = payload.stdin ? Buffer.from(payload.stdin, 'base64').toString('utf-8') : '';

      // Determine simulated verdict based on source code content
      let status_id = 3; // Accepted
      let stdout = 'Hello World\n';
      let stderr = '';
      let compile_output = '';
      let time = 0.05;
      let memory = 14200;

      if (sourceCode.includes('COMPILATION_FAIL')) {
        status_id = 6; // Compilation Error
        compile_output = Buffer.from('SyntaxError: unexpected token\n').toString('base64');
        stdout = '';
      } else if (sourceCode.includes('RUNTIME_FAIL')) {
        status_id = 11; // Runtime Error (NZEC)
        stderr = Buffer.from('ZeroDivisionError: division by zero\n').toString('base64');
        stdout = '';
      } else if (sourceCode.includes('TIMEOUT_FAIL')) {
        status_id = 5; // Time Limit Exceeded
        stdout = '';
        time = 2.01;
      } else if (stdin === '10 20') {
        stdout = '30\n';
      }

      mockSubmissions.set(token, {
        token,
        status_id,
        status: { id: status_id, description: status_id === 3 ? 'Accepted' : 'Failed' },
        stdout: Buffer.from(stdout).toString('base64'),
        stderr: stderr || null,
        compile_output: compile_output || null,
        time,
        memory,
        pollCount: 0
      });

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ token }));
    });
    return;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/submissions/')) {
    const token = url.pathname.replace('/submissions/', '');
    const sub = mockSubmissions.get(token);
    if (!sub) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    sub.pollCount++;
    // Simulate: first poll returns In Queue (status_id: 1), second poll returns Finished
    if (sub.pollCount === 1) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        token: sub.token,
        status_id: 1,
        status: { id: 1, description: 'In Queue' }
      }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(sub));
    return;
  }

  if (req.method === 'GET' && url.pathname === '/system_info') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ version: '1.13.1', workers: 2 }));
    return;
  }

  res.writeHead(404);
  res.end();
});

await new Promise(resolve => mockServer.listen(TEST_PORT, resolve));
console.log(`📡 Mock Judge0 server listening on http://localhost:${TEST_PORT}`);

try {
  // Test 1: Successful Code Execution with stdin
  console.log('\n--- 1. Testing Successful Execution with stdin ---');
  const runRes = await CodeExecutionService.runCode({
    language: 'python',
    sourceCode: 'a, b = map(int, input().split())\nprint(a + b)',
    stdin: '10 20'
  });
  console.log('Result:', runRes);
  assert.strictEqual(runRes.success, true);
  assert.strictEqual(runRes.status, 'ACCEPTED');
  assert.strictEqual(runRes.verdict, 'Accepted');
  assert.strictEqual(runRes.stdout.trim(), '30');
  console.log('✅ Successful execution with stdin passed');

  // Test 2: Compilation Error Handling
  console.log('\n--- 2. Testing Compilation Error Handling ---');
  const compRes = await CodeExecutionService.runCode({
    language: 'cpp',
    sourceCode: 'int main() { COMPILATION_FAIL }'
  });
  console.log('Result:', compRes);
  assert.strictEqual(runRes.success, true);
  assert.strictEqual(compRes.status, 'COMPILATION_ERROR');
  assert.strictEqual(compRes.verdict, 'Compilation Error');
  assert.ok(compRes.compileOutput.includes('SyntaxError'));
  console.log('✅ Compilation Error correctly normalized and captured');

  // Test 3: Runtime Error Handling
  console.log('\n--- 3. Testing Runtime Error Handling ---');
  const runtimeRes = await CodeExecutionService.runCode({
    language: 'python',
    sourceCode: 'x = 1 / 0 # RUNTIME_FAIL'
  });
  console.log('Result:', runtimeRes);
  assert.strictEqual(runtimeRes.status, 'RUNTIME_ERROR');
  assert.strictEqual(runtimeRes.verdict, 'Runtime Error');
  assert.ok(runtimeRes.stderr.includes('ZeroDivisionError'));
  console.log('✅ Runtime Error correctly normalized and captured');

  // Test 4: Time Limit Exceeded
  console.log('\n--- 4. Testing Time Limit Exceeded ---');
  const timeoutRes = await CodeExecutionService.runCode({
    language: 'python',
    sourceCode: 'while True: pass # TIMEOUT_FAIL'
  });
  console.log('Result:', timeoutRes);
  assert.strictEqual(timeoutRes.status, 'TIME_LIMIT_EXCEEDED');
  assert.strictEqual(timeoutRes.verdict, 'Time Limit Exceeded');
  console.log('✅ Time Limit Exceeded correctly normalized and captured');

  // Test 5: Health Check
  console.log('\n--- 5. Testing Health Check ---');
  const health = await Judge0Service.checkHealth();
  console.log('Health:', health);
  assert.strictEqual(health.healthy, true);
  assert.strictEqual(health.systemInfo.version, '1.13.1');
  console.log('✅ Health check connected and passed');

  console.log('\n🏆 ALL END-TO-END VERIFICATION SCENARIOS PASSED 100%!');
} finally {
  mockServer.close();
}
