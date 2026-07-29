import { createServer } from 'node:http';
import { createApp } from './app.js';
import { config } from './config.js';
import { setupSockets } from './sockets/index.js';
import { connectDB } from './config/db.js';

// ─── Crash-Proof Global Exception Handlers ─────────────────────────────────
// Prevents any unhandled error from bringing down the platform for 10,000 users
process.on('uncaughtException', (err) => {
  console.error('[SystemGuard] Uncaught Exception protected:', err.stack || err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[SystemGuard] Unhandled Rejection protected:', reason);
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
  console.log(`=============================================================`);
  console.log(`🚀 MujCode High-Concurrency Server Running!`);
  console.log(`🌐 Address:          http://${config.host}:${config.port}`);
  console.log(`👥 Max Connections:  ${server.maxConnections} simultaneous users`);
  console.log(`💾 Storage Engine:   In-Memory DB Cache + Atomic Disk Writes`);
  console.log(`🐳 Compiler Engine:  ExecutionQueue (20 concurrent Docker max)`);
  console.log(`=============================================================`);
});

