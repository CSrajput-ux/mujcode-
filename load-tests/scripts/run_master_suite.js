import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { httpRequest } from '../lib/client.js';
import { runGraduatedLoad } from '../scenarios/graduated_load.js';
import { runRampTest, runSpikeTest } from '../scenarios/ramp_spike.js';
import { runUserJourneys } from '../scenarios/user_journeys.js';
import { runDeepConcurrencyTests } from '../scenarios/concurrency_deep.js';
import { runAuthStressTest } from '../scenarios/auth_stress.js';
import { runFileDownloadStressTest } from '../scenarios/file_download_stress.js';
import { runFailureInjectionTests } from '../scenarios/failure_injection.js';
import { runReproducibilityTests } from '../scenarios/reproducibility.js';
import { runDatabaseReconciliation } from '../scenarios/data_reconciliation.js';
import { runApiBenchmark } from '../scenarios/api_benchmark.js';
import { runSecurityLoadTest } from '../scenarios/security_load_test.js';
import { generateAllReports } from './generate_reports.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_URL = process.env.TARGET_URL || 'http://127.0.0.1:5000';

async function main() {
  console.log(`========================================================================`);
  console.log(`  MUJCODE PRODUCTION-GRADE 500 CONCURRENT USERS MASTER CERTIFICATION SUITE`);
  console.log(`  Target: ${BASE_URL} | Execution Timestamp: ${new Date().toISOString()}`);
  console.log(`========================================================================\n`);

  const masterResults = {
    metadata: {
      timestamp: new Date().toISOString(),
      target: BASE_URL,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    }
  };

  // 1. Check server health & initial metrics
  const initSys = await httpRequest({ baseUrl: BASE_URL, path: '/api/system/metrics', timeoutMs: 3000 });
  masterResults.systemMetricsInitial = initSys.data;
  console.log(`[Health] Initial Backend PID: ${initSys.data?.pid} | Initial RSS: ${initSys.data?.memory?.rssMb}MB`);

  // 2. Graduated Load Suite (1, 5, 10, 25, 50, 100, 250, 350, 400, 500)
  masterResults.graduatedLoad = await runGraduatedLoad(BASE_URL);

  // 3. Ramp-Up & Spike Tests
  masterResults.rampUp = await runRampTest(BASE_URL);
  masterResults.spikeTest = await runSpikeTest(BASE_URL);

  // 4. Dedicated 5 User Journeys
  masterResults.userJourneys = await runUserJourneys(BASE_URL);

  // 5. Deep Concurrency & Database Race Tests
  masterResults.concurrencyRace = await runDeepConcurrencyTests(BASE_URL);

  // 6. Auth Stress Test (50, 100, 500 logins)
  masterResults.authStress = await runAuthStressTest(BASE_URL);

  // 7. File Download Streaming Test (10, 50, 100, 250, 500 downloads)
  masterResults.fileDownloads = await runFileDownloadStressTest(BASE_URL);

  // 8. API Endpoint Benchmarks (15 Core Endpoints)
  masterResults.apiBenchmark = await runApiBenchmark(BASE_URL);

  // 9. Security & Access Isolation Test
  masterResults.securityLoad = await runSecurityLoadTest(BASE_URL);

  // 10. Failure Injection Tests
  masterResults.failureInjection = await runFailureInjectionTests(BASE_URL);

  // 11. Three-Run Reproducibility Suite (500 Users × 3 runs)
  masterResults.reproducibility = await runReproducibilityTests(BASE_URL);

  // 12. Final Database Reconciliation against PostgreSQL
  masterResults.databaseReconciliation = await runDatabaseReconciliation(BASE_URL);

  // 13. Final System Metrics
  const finalSys = await httpRequest({ baseUrl: BASE_URL, path: '/api/system/metrics', timeoutMs: 3000 });
  masterResults.systemMetricsFinal = finalSys.data;

  // 14. Generate All Reports (JSON, CSV, HTML, MD)
  const reportPaths = generateAllReports(masterResults);

  console.log(`\n========================================================================`);
  console.log(`  ALL CERTIFICATION TESTS COMPLETED SUCCESSFULLY!`);
  console.log(`  JSON: ${reportPaths.jsonPath}`);
  console.log(`  CSV:  ${reportPaths.csvPath}`);
  console.log(`  HTML: ${reportPaths.htmlPath}`);
  console.log(`  MD:   ${reportPaths.mdPath}`);
  console.log(`========================================================================\n`);

  process.exit(0);
}

main().catch(err => {
  console.error('[FATAL] Certification suite error:', err);
  process.exit(1);
});
