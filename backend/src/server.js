process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || '32';

import cluster from 'node:cluster';
import os from 'node:os';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { logger } from './lib/logger.js';

// ─── Cluster Mode: Spawn one worker per CPU core ──────────────────────────────
// This is the single biggest performance lever — multiplies throughput by numCPUs.
// Each worker handles connections independently (no shared memory bottleneck).
const NUM_WORKERS = process.env.WEB_CONCURRENCY
  ? Math.max(1, parseInt(process.env.WEB_CONCURRENCY, 10))
  : process.env.WORKERS
    ? Math.max(1, parseInt(process.env.WORKERS, 10))
    : Math.max(1, Math.min(os.cpus().length, 4));

if (cluster.isPrimary) {
  cluster.setupPrimary({
    exec: fileURLToPath(import.meta.url)
  });

  logger.info(`[Cluster] Primary PID ${process.pid} starting ${NUM_WORKERS} workers...`);

  for (let i = 0; i < NUM_WORKERS; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`[Cluster] Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
    cluster.fork(); // Auto-restart crashed workers
  });

  cluster.on('online', (worker) => {
    logger.info(`[Cluster] Worker ${worker.process.pid} online`);
  });

  // Inter-worker Cache Synchronization Broker
  cluster.on('message', (worker, message) => {
    if (message?.type === 'CACHE_SYNC') {
      for (const id in cluster.workers) {
        const w = cluster.workers[id];
        if (w && w.process.pid !== worker.process.pid) {
          w.send(message);
        }
      }
    }
  });

} else {
  // ─── Worker Process ───────────────────────────────────────────────────────────
  const { createApp } = await import('./app.js');
  const { config } = await import('./config.js');
  const { setupSockets } = await import('./sockets/index.js');
  const { connectDB } = await import('./config/db.js');
  const { flushDbSync, loadDbFromPostgresOrFile, onWorkerCacheSync } = await import('./lib/storage.js');
  const { initPostgres, closePostgres } = await import('./lib/postgres.js');

  // Receive Cache Synchronization updates from sibling workers via primary broker
  process.on('message', (message) => {
    if (message?.type === 'CACHE_SYNC') {
      onWorkerCacheSync(message);
    }
  });

  // ─── Crash-Proof Global Exception Handlers ─────────────────────────────────
  process.on('uncaughtException', (err) => {
    // Suppress transient network/socket disconnects from crashing cluster workers
    if (
      err?.code === 'ECONNRESET' ||
      err?.code === 'EPIPE' ||
      err?.code === 'ETIMEDOUT' ||
      err?.message?.includes('Connection terminated') ||
      err?.message?.includes('socket hang up') ||
      err?.message?.includes('Channel closed')
    ) {
      logger.warn(`[SystemGuard] Recovered from transient network exception: ${err.message}`);
      return;
    }
    logger.error('[SystemGuard] Fatal Uncaught Exception — shutting down:', err.stack || err);
    flushDbSync();
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    const msg = typeof reason === 'string' ? reason : (reason?.message || String(reason));
    if (
      msg?.includes('Connection terminated') ||
      msg?.includes('ECONNRESET') ||
      msg?.includes('ETIMEDOUT') ||
      msg?.includes('Channel closed')
    ) {
      logger.warn(`[SystemGuard] Handled transient rejected promise: ${msg}`);
      return;
    }
    logger.error('[SystemGuard] Fatal Unhandled Rejection — shutting down:', reason);
    flushDbSync();
    process.exit(1);
  });

  const isPgActive = await initPostgres();
  await loadDbFromPostgresOrFile();

  const app = await createApp();
  const server = createServer(app);

  // ─── High-Concurrency HTTP Configuration ─────────────────────────────────────
  server.maxConnections    = 50000;   // Per-worker limit
  server.keepAliveTimeout  = 65000;
  server.headersTimeout    = 66000;
  server.requestTimeout    = 30000;

  setupSockets(server);
  connectDB();

  server.listen(config.port, config.host, () => {
    logger.info(`[Worker ${process.pid}] Listening on http://${config.host}:${config.port}`);
  });

  // ─── Graceful Shutdown ─────────────────────────────────────────────────────
  async function gracefulShutdown(signal) {
    logger.info(`[Worker ${process.pid}] ${signal} — draining connections...`);
    server.close(async () => {
      flushDbSync();
      await closePostgres();
      process.exit(0);
    });
    setTimeout(async () => {
      flushDbSync();
      await closePostgres();
      process.exit(1);
    }, 10000).unref();
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
}
