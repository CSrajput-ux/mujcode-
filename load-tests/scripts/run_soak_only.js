import { runSoakTest } from '../scenarios/soak_test_runner.js';

const duration = parseInt(process.env.SOAK_SECONDS || '1800', 10);
const users = parseInt(process.env.SOAK_USERS || '500', 10);
const interval = parseInt(process.env.SAMPLE_INTERVAL || '5', 10);
const baseUrl = process.env.TARGET_URL || 'http://127.0.0.1:5000';

runSoakTest({
  durationSeconds: duration,
  userCount: users,
  sampleIntervalSec: interval,
  baseUrl,
  outputPrefix: 'soak_500_metrics'
}).then(() => {
  console.log('[Soak CLI] Finished soak test execution successfully.');
  process.exit(0);
}).catch(err => {
  console.error('[Soak CLI] Error running soak test:', err);
  process.exit(1);
});
