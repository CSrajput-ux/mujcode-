export const config = {
  baseUrl: process.env.TARGET_URL || 'http://127.0.0.1:5000',
  concurrencyLevels: [1, 5, 10, 25, 50, 100, 250, 350, 400, 500],
  soakDurationMinutes: parseInt(process.env.SOAK_DURATION_MINUTES || '30', 10),
  soakUsers: 500,
  metricsSampleIntervalSec: 5,
  thresholds: {
    p50Ms: 300,
    p95Ms: 500,
    p99Ms: 1500,
    maxMs: 5000,
    errorRatePct: 1.0,
    workerCrashes: 0,
    unhandledRejections: 0,
    duplicateRecords: 0,
    lostUpdates: 0
  },
  personasDistribution: {
    NORMAL: 0.60,
    SEARCH_HEAVY: 0.10,
    READ_HEAVY: 0.15,
    WRITE_HEAVY: 0.10,
    ADMIN_HEAVY: 0.05
  }
};
