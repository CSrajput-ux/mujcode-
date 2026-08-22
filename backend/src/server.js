import { createServer } from 'node:http';
import { createApp } from './app.js';
import { config } from './config.js';
import { setupSockets } from './sockets/index.js';
import { connectDB } from './config/db.js';
import { flushDbSync } from './lib/storage.js';
import { logger } from './lib/logger.js';

// ─── Crash-Proof Global Exception Handlers ─────────────────────────────────
// Log the error, flush data, then exit so Docker can restart the container cleanly.
process.on('uncaughtException', (err) => {
  logger.error('[SystemGuard] Uncaught Exception — shutting down:', err.stack || err);
  flushDbSync();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('[SystemGuard] Unhandled Rejection — shutting down:', reason);
  flushDbSync();
  process.exit(1);
});

const app = await createApp();
const server = createServer(app);

// ─── High-Concurrency HTTP & Socket Configuration ──────────────────────────
// Optimized to handle 10,000+ simultaneous connections without EMFILE or timeout errors
server.maxConnections = 15000;
server.keepAliveTimeout = 65000; // Keep connections alive to avoid TCP handshake overhead
server.headersTimeout = 66000;   // Higher than keepAliveTimeout (Node.js best practice)
server.requestTimeout = 30000;   // Free up stalled connections after 30 seconds

setupSockets(server);

// Connect to MongoDB Database
connectDB();

server.listen(config.port, config.host, () => {
  logger.info(`=============================================================`);
  logger.info(`🚀 MujCode High-Concurrency Server Running!`);
  logger.info(`🌐 Address:          http://${config.host}:${config.port}`);
  logger.info(`👥 Max Connections:  ${server.maxConnections} simultaneous users`);
  logger.info(`💾 Storage Engine:   In-Memory DB Cache + Atomic Disk Writes`);
  logger.info(`🐳 Compiler Engine:  ExecutionQueue (20 concurrent Docker max)`);
  logger.info(`=============================================================`);
});

// ─── Graceful Shutdown ─────────────────────────────────────────────────────
// Drain active connections before exiting
function gracefulShutdown(signal) {
  logger.info(`\n[Shutdown] ${signal} received. Draining connections...`);

  server.close(() => {
    flushDbSync();
    console.log('[Shutdown] Database flushed. Exiting.');
    process.exit(0);
  });

  // Force exit after 10 seconds if connections won't drain
  setTimeout(() => {
    console.error('[Shutdown] Forcing exit after 10s timeout.');
    flushDbSync();
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

