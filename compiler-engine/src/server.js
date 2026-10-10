import express from 'express';
import { config } from './config.js';
import { judge0CompatRouter } from './routes/judge0Compat.js';
import { compilerApiRouter } from './routes/compilerApi.js';

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/health' && req.path !== '/system_info') {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// Root & Health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'mujcode-compiler-engine', uptime: process.uptime() });
});

// Mount Judge0 Compatibility endpoints directly at root
app.use('/', judge0CompatRouter);

// Mount Master Engineering Prompt endpoints under /api/compiler
app.use('/api/compiler', compilerApiRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(err.statusCode || 500).json({ error: err.message || 'Internal Server Error' });
});

const server = app.listen(config.port, config.host, () => {
  console.log(`================================================================`);
  console.log(`🚀 MUJCODE Compiler Engine running on http://${config.host}:${config.port}`);
  console.log(`   Languages Supported: C, C++, Java, Python, JavaScript, Go, SQL (7 total)`);
  console.log(`   Concurrency Limit: ${config.workerConcurrency} workers`);
  console.log(`   Judge0 Compatible: Yes (/submissions, /languages)`);
  console.log(`   Compiler API: Yes (/api/compiler/*)`);
  console.log(`================================================================`);
});

// Graceful shutdown
function shutdown(signal) {
  console.log(`Received ${signal}. Shutting down MUJCODE Compiler Engine...`);
  server.close(() => {
    console.log('Compiler Engine HTTP server closed.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Force shutdown after 5s timeout.');
    process.exit(1);
  }, 5000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

export default app;
