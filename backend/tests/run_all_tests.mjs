import fs from 'node:fs';
import path from 'node:path';
import { startTestServer, stopTestServer, results } from './test_helper.mjs';
import { runAuthSuite } from './suite_auth.mjs';
import { runApiCrudSuite } from './suite_api_crud.mjs';
import { runSecuritySuite } from './suite_security.mjs';
import { runEdgeCasesSuite } from './suite_edge_cases.mjs';
import { runAiProctoringSuite } from './suite_ai_proctoring.mjs';

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║        MUJCODE FULL-STACK END-TO-END QA TEST RUNNER           ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

const suiteStartTime = Date.now();

try {
  // 1. Start test server
  console.log('🚀 Starting Test Server on port 5099...');
  await startTestServer();
  console.log('✅ Test Server operational.\n');

  // 2. Auth Suite
  const tokens = await runAuthSuite();

  // 3. Core API Suite
  await runApiCrudSuite(tokens);

  // 4. Security Audit Suite
  await runSecuritySuite(tokens);

  // 5. Boundary & Edge Cases Suite
  await runEdgeCasesSuite(tokens);

  // 6. AI Proctoring Suite
  await runAiProctoringSuite(tokens);

} catch (err) {
  console.error('❌ Critical Test Harness Failure:', err);
} finally {
  await stopTestServer();
  console.log('\n🛑 Test Server shut down cleanly.\n');
}

const suiteDuration = Date.now() - suiteStartTime;

// Compute metrics
const total = results.length;
const passed = results.filter(r => r.result === 'PASS').length;
const failed = results.filter(r => r.result === 'FAIL').length;
const blocked = results.filter(r => r.result === 'BLOCKED').length;
const notTested = results.filter(r => r.result === 'NOT TESTED').length;

const failedTests = results.filter(r => r.result === 'FAIL');
const criticalBugs = failedTests.filter(r => r.severity === 'Critical').length;
const highBugs = failedTests.filter(r => r.severity === 'High').length;
const mediumBugs = failedTests.filter(r => r.severity === 'Medium').length;
const lowBugs = failedTests.filter(r => r.severity === 'Low').length;

console.log('=================================================================');
console.log('                  TEST EXECUTION SUMMARY RESULTS                 ');
console.log('=================================================================');
console.log(`TOTAL TEST CASES:    ${total}`);
console.log(`EXECUTED:            ${total}`);
console.log(`PASSED:              ${passed} ( ${Math.round((passed / total) * 100)}% )`);
console.log(`FAILED:              ${failed}`);
console.log(`BLOCKED:             ${blocked}`);
console.log(`NOT TESTED:          ${notTested}`);
console.log(`TOTAL DURATION:      ${suiteDuration}ms`);
console.log('-----------------------------------------------------------------');
console.log(`BUGS IDENTIFIED:     ${failed}`);
console.log(`CRITICAL BUGS:       ${criticalBugs}`);
console.log(`HIGH BUGS:           ${highBugs}`);
console.log(`MEDIUM BUGS:         ${mediumBugs}`);
console.log(`LOW BUGS:            ${lowBugs}`);
console.log('=================================================================\n');

if (failedTests.length > 0) {
  console.log('⚠️ FAILED TESTS DETAILS:');
  failedTests.forEach(f => {
    console.log(`- [${f.testId}] ${f.feature}: ${f.errorMessage || f.actualResult}`);
    if (f.bugId) console.log(`  Bug ID: ${f.bugId} | Severity: ${f.severity} | Fix: ${f.recommendedFix}`);
  });
}

// Write results to JSON artifact
const reportPath = path.resolve('./tests/test_run_report.json');
fs.writeFileSync(reportPath, JSON.stringify({
  executedAt: new Date().toISOString(),
  durationMs: suiteDuration,
  summary: { total, passed, failed, blocked, notTested, criticalBugs, highBugs, mediumBugs, lowBugs },
  results
}, null, 2));
console.log(`\n💾 Detailed test run output written to: ${reportPath}\n`);

process.exit(0);
