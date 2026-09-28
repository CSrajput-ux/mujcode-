import client from 'prom-client';

export const register = new client.Registry();

register.setDefaultLabels({ app: 'mujcode-backend' });

// Collect default metrics every 10s instead of default 10s (already good),
// but disable GC stats which are very expensive to collect.
client.collectDefaultMetrics({
  register,
  gcDurationBuckets: [], // disable expensive GC histogram
  eventLoopMonitoringPrecision: 20 // reduce CPU usage of event loop lag monitor
});

// ─── Custom Metrics ────────────────────────────────────────────────────────────
// Use fewer histogram buckets — each bucket is a separate time-series label set
// and observe() iterates ALL buckets on every call.

export const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'code'],
  buckets: [5, 25, 100, 500, 2000], // reduced from 7 buckets to 5
  registers: [register]
});

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'code'],
  registers: [register]
});

export const judge0SubmissionsTotal = new client.Counter({
  name: 'judge0_submissions_total',
  help: 'Total number of submissions processed via Judge0',
  labelNames: ['language', 'status'],
  registers: [register]
});
