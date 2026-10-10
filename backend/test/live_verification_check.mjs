import assert from 'node:assert/strict';
import { CodeExecutionService } from '../src/services/CodeExecutionService.js';
import { Judge0Service } from '../src/services/Judge0Service.js';

const COMPILER_URL = 'http://127.0.0.1:2359';
const BACKEND_URL = 'http://localhost:5000';

function logStep(name) {
  console.log(`\n==================================================`);
  console.log(`  RUNNING: ${name}`);
  console.log(`==================================================`);
}

function logPass(msg) {
  console.log(`  [PASS] ${msg}`);
}

function logFail(msg, err) {
  console.error(`  [FAIL] ${msg}:`, err);
  process.exitCode = 1;
}

async function runCompleteEngineCheck() {
  console.log('STARTING COMPLETE MUJCODE COMPILER ENGINE VERIFICATION');
  console.log('Timestamp:', new Date().toISOString());

  // ─────────────────────────────────────────────────────────────
  // 1. ENGINE HEALTH & REGISTRY
  // ─────────────────────────────────────────────────────────────
  logStep('1. Health Check & Language Registry');
  try {
    const healthRes = await fetch(`${COMPILER_URL}/health`);
    assert.equal(healthRes.status, 200, 'Health endpoint must return 200');
    const healthData = await healthRes.json();
    assert.ok(String(healthData.status).toLowerCase() === 'ok', 'Engine health status must be ok');
    assert.equal(healthData.service, 'mujcode-compiler-engine', 'Service name match');
    logPass(`Health check OK: ${healthData.service} (Uptime: ${Math.round(healthData.uptime)}s)`);

    const langRes = await fetch(`${COMPILER_URL}/languages`);
    assert.equal(langRes.status, 200);
    const languages = await langRes.json();
    assert.equal(languages.length, 7, 'Must expose exactly 7 approved languages');
    const langNames = languages.map(l => l.name);
    logPass(`Languages (${languages.length}): ${langNames.join(', ')}`);
  } catch (err) {
    logFail('Health or Language Registry check failed', err);
  }

  // ─────────────────────────────────────────────────────────────
  // 2. SEVEN LANGUAGES EXECUTION MATRIX (Direct Engine Port 2359)
  // ─────────────────────────────────────────────────────────────
  logStep('2. Direct Execution Matrix Across All 7 Languages (Port 2359)');

  const testMatrix = [
    {
      lang: 'C (GCC)',
      id: 50,
      code: '#include <stdio.h>\nint main() { char name[32]; if(scanf("%s", name)==1) printf("Hello, %s!", name); else printf("Hello, C!"); return 0; }',
      stdin: 'StudentC',
      expected: 'Hello, StudentC'
    },
    {
      lang: 'C++ (G++)',
      id: 54,
      code: '#include <iostream>\n#include <string>\nusing namespace std;\nint main() { string s; cin >> s; cout << "MUJCODE_CPP:" << s << endl; return 0; }',
      stdin: 'VerifiedCpp',
      expected: 'MUJCODE_CPP:VerifiedCpp'
    },
    {
      lang: 'Java (OpenJDK)',
      id: 62,
      code: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String val = sc.hasNext() ? sc.next() : "Default";\n        System.out.println("JAVA_OUTPUT:" + val);\n    }\n}',
      stdin: 'NoHeapBug',
      expected: 'JAVA_OUTPUT:NoHeapBug'
    },
    {
      lang: 'Python (Python 3)',
      id: 71,
      code: 'import sys\nval = sys.stdin.read().strip()\nprint(f"PYTHON_UNICODE: {val} \u2705")',
      stdin: 'ManipalUniversityJaipur',
      expected: 'PYTHON_UNICODE: ManipalUniversityJaipur \u2705'
    },
    {
      lang: 'JavaScript (Node.js)',
      id: 63,
      code: 'const fs = require("fs");\nconst input = fs.readFileSync(0, "utf-8").trim();\nconsole.log(JSON.stringify({ status: "JS_OK", echo: input }));',
      stdin: 'NodeV8Live',
      expected: '"status":"JS_OK"'
    },
    {
      lang: 'Go (Golang)',
      id: 60,
      code: 'package main\nimport ("fmt"; "os"; "io")\nfunc main() {\n    b, _ := io.ReadAll(os.Stdin)\n    fmt.Printf("GO_RESULT:%s\\n", string(b))\n}',
      stdin: 'GolangLiveCheck',
      expected: 'GO_RESULT:GolangLiveCheck'
    },
    {
      lang: 'SQL (Isolated Engine)',
      id: 82,
      code: 'SELECT name, marks FROM students WHERE marks >= 80 ORDER BY marks DESC;',
      schemaSql: 'CREATE TABLE students (id INT PRIMARY KEY, name TEXT, marks INT);',
      seedSql: "INSERT INTO students VALUES (1, 'Aman', 92), (2, 'Priya', 85), (3, 'Rohan', 72);",
      expected: 'Aman'
    }
  ];

  for (const item of testMatrix) {
    const startTime = Date.now();
    try {
      const payload = {
        language_id: item.id,
        source_code: Buffer.from(item.code).toString('base64'),
        stdin: item.stdin ? Buffer.from(item.stdin).toString('base64') : null,
        schema_sql: item.schemaSql ? Buffer.from(item.schemaSql).toString('base64') : null,
        seed_sql: item.seedSql ? Buffer.from(item.seedSql).toString('base64') : null,
        base64_encoded: true
      };

      const res = await fetch(`${COMPILER_URL}/submissions?wait=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      assert.equal(res.status, 201, `${item.lang} submission must return HTTP 201`);
      const body = await res.json();
      assert.equal(body.status?.id, 3, `${item.lang} status must be 3 (Accepted). Got status: ${body.status?.description}, stderr: ${body.stderr}`);
      
      const stdout = body.stdout ? Buffer.from(body.stdout, 'base64').toString('utf8') : '';
      assert.ok(stdout.includes(item.expected), `${item.lang} stdout must contain '${item.expected}'. Received: ${stdout}`);
      
      const elapsed = Date.now() - startTime;
      logPass(`${item.lang}: Accepted in ${elapsed}ms (Engine recorded: ${body.time}s)`);
    } catch (err) {
      logFail(`${item.lang} execution test failed`, err);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 3. ERROR HANDLING & SANDBOX SECURITY BOUNDARIES
  // ─────────────────────────────────────────────────────────────
  logStep('3. Error Handling, Timeouts & Security Constraints');

  // 3.1 Compilation Error
  try {
    const res = await fetch(`${COMPILER_URL}/submissions?wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language_id: 54, // C++
        source_code: Buffer.from('int main() { syntax_error_here; }').toString('base64'),
        base64_encoded: true
      })
    });
    const body = await res.json();
    assert.equal(body.status?.id, 6, 'Status must be 6 (Compilation Error)');
    logPass('C++ Compilation Error correctly caught and reported (Status 6)');
  } catch (err) {
    logFail('Compilation error test failed', err);
  }

  // 3.2 Runtime Error
  try {
    const res = await fetch(`${COMPILER_URL}/submissions?wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language_id: 71, // Python
        source_code: Buffer.from('x = 1 / 0').toString('base64'),
        base64_encoded: true
      })
    });
    const body = await res.json();
    assert.equal(body.status?.id, 11, 'Status must be 11 (Runtime Error)');
    logPass('Python Runtime Error (ZeroDivisionError) correctly caught (Status 11)');
  } catch (err) {
    logFail('Runtime error test failed', err);
  }

  // 3.3 Infinite Loop Timeout
  try {
    const startTimeout = Date.now();
    const res = await fetch(`${COMPILER_URL}/submissions?wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language_id: 71, // Python
        source_code: Buffer.from('while True: pass').toString('base64'),
        cpu_time_limit: 1,
        base64_encoded: true
      })
    });
    const body = await res.json();
    const dur = Date.now() - startTimeout;
    assert.equal(body.status?.id, 5, 'Status must be 5 (Time Limit Exceeded)');
    logPass(`Infinite Loop terminated with TLE (Status 5) in ${dur}ms`);
  } catch (err) {
    logFail('Timeout test failed', err);
  }

  // 3.4 SQL Security Guard: Block ATTACH DATABASE
  try {
    const res = await fetch(`${COMPILER_URL}/submissions?wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language_id: 82, // SQL
        source_code: Buffer.from("ATTACH DATABASE '/etc/passwd' AS stolen;").toString('base64'),
        base64_encoded: true
      })
    });
    const body = await res.json();
    assert.equal(body.status?.id, 11, 'Malicious SQL must be rejected with Runtime Error');
    const stderr = body.stderr ? Buffer.from(body.stderr, 'base64').toString('utf8') : '';
    assert.ok(stderr.includes('Disallowed SQL pattern') || stderr.includes('Security Exception'), 'Must reject ATTACH DATABASE command');
    logPass('SQL Sandbox successfully blocked filesystem attach attack');
  } catch (err) {
    logFail('SQL sandbox exploit test failed', err);
  }

  // 3.5 Rejection of Unsupported Language
  try {
    const res = await fetch(`${COMPILER_URL}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language_id: 999, // Non-existent
        source_code: 'print(1)'
      })
    });
    assert.equal(res.status, 400, 'Unsupported language must be rejected with HTTP 400');
    logPass('Unsupported language ID rejected with structured HTTP 400');
  } catch (err) {
    logFail('Unsupported language rejection failed', err);
  }

  // ─────────────────────────────────────────────────────────────
  // 4. BACKEND INTEGRATION & REAL TEST CASE JUDGING
  // ─────────────────────────────────────────────────────────────
  logStep('4. Backend CodeExecutionService & Real Problem Test Cases');

  // Test single code run via CodeExecutionService
  try {
    const pyRun = await CodeExecutionService.runCode({
      language: 'python',
      sourceCode: 'print(sum([10, 20, 30, 40]))'
    });
    assert.equal(pyRun.status, 'ACCEPTED');
    assert.ok(pyRun.stdout.includes('100'));
    logPass(`Backend CodeExecutionService Python run: ${pyRun.stdout.trim()} (Time: ${pyRun.timeMs}ms)`);
  } catch (err) {
    logFail('Backend CodeExecutionService runCode failed', err);
  }

  // Test C++ run via CodeExecutionService
  try {
    const cppRun = await CodeExecutionService.runCode({
      language: 'cpp',
      sourceCode: '#include <iostream>\nint main(){ std::cout << 42 * 2 << std::endl; return 0; }'
    });
    assert.equal(cppRun.status, 'ACCEPTED');
    assert.ok(cppRun.stdout.includes('84'));
    logPass(`Backend CodeExecutionService C++ run: ${cppRun.stdout.trim()}`);
  } catch (err) {
    logFail('Backend CodeExecutionService C++ failed', err);
  }

  // Test Java run via CodeExecutionService
  try {
    const javaRun = await CodeExecutionService.runCode({
      language: 'java',
      sourceCode: 'public class Main { public static void main(String[] args) { System.out.println("JAVA_BACKEND_SUCCESS"); } }'
    });
    assert.equal(javaRun.status, 'ACCEPTED');
    assert.ok(javaRun.stdout.includes('JAVA_BACKEND_SUCCESS'));
    logPass(`Backend CodeExecutionService Java run: ${javaRun.stdout.trim()}`);
  } catch (err) {
    logFail('Backend CodeExecutionService Java failed', err);
  }

  // Test Real Problem ADSA001 Judging (All 5 test cases - 2 public, 3 hidden)
  try {
    const testCases = [
      { input: "3\napple app application\n4\napp apple apply application", expectedOutput: "YES\nYES\nNO\nYES" },
      { input: "2\nhello world\n2\nhell hello", expectedOutput: "NO\nYES" },
      { input: "1\na\n1\na", expectedOutput: "YES" },
      { input: "3\ncat car card\n3\nca cat cart", expectedOutput: "NO\nYES\nNO" },
      { input: "5\nthe their there these this\n3\nthe them this", expectedOutput: "YES\nNO\nYES" }
    ];

    const pythonSolution = `
import sys

def solve():
    raw = sys.stdin.read().split()
    if not raw:
        return
    n = int(raw[0])
    dictionary = set(raw[1:1+n])
    m_idx = 1 + n
    m = int(raw[m_idx])
    queries = raw[m_idx+1:m_idx+1+m]
    for q in queries:
        if q in dictionary:
            print("YES")
        else:
            print("NO")

solve()
`;

    const judgeResult = await CodeExecutionService.executeTestCases({
      language: 'python',
      sourceCode: pythonSolution,
      testCases,
      cpuTimeLimit: 2,
      memoryLimit: 128000
    });

    assert.equal(judgeResult.passed, true, `All test cases must pass. Failed results: ${JSON.stringify(judgeResult.results.filter(r => !r.passed))}`);
    assert.equal(judgeResult.results.length, 5, 'Must evaluate all 5 test cases');
    const passedCount = judgeResult.results.filter(r => r.passed).length;
    assert.equal(passedCount, 5, 'All 5 test cases must pass');
    logPass(`Real Problem ADSA001 Full Test Suite: Passed = ${judgeResult.passed} (${passedCount}/${judgeResult.results.length} passed)`);
  } catch (err) {
    logFail('Real Problem judging test failed', err);
  }

  // ─────────────────────────────────────────────────────────────
  // 5. SUMMARY
  // ─────────────────────────────────────────────────────────────
  logStep('5. Engine Verification Complete');
  if (process.exitCode === 1) {
    console.error('\n❌ ENGINE CHECK FAILED ON ONE OR MORE TESTS.');
  } else {
    console.log('\n✅ ALL VERIFICATION CHECKS PASSED: The engine is working flawlessly!');
  }
}

runCompleteEngineCheck().catch(err => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
