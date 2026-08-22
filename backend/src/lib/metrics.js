import client from 'prom-client';

// Create a Registry which registers the metrics
export const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'mujcode-backend'
});

// Enable the collection of default metrics (CPU, Memory, Event Loop Lag)
client.collectDefaultMetrics({ register });

// --- Custom Metrics ---

export const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'code'],
  buckets: [10, 50, 100, 300, 500, 1000, 5000],
  registers: [register]
});

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'code'],
  registers: [register]
});

export const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active WebSocket or HTTP connections',
  registers: [register]
});

export const compilerQueueJobs = new client.Counter({
  name: 'compiler_jobs_submitted_total',
  help: 'Total number of jobs submitted to the Redis queue',
  labelNames: ['language'],
  registers: [register]
});
