import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

// ─── Async Logger — buffered writes, never blocks the event loop ───────────────
// Winston's default Console transport flushes synchronously on every log call,
// which blocks the event loop under high throughput. We use a short buffer to
// batch log lines and flush them in a single I/O burst.

const ASYNC_FLUSH_MS = 50; // flush buffer every 50ms maximum
let logBuffer = [];
let flushTimer = null;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    const lines = logBuffer.splice(0);
    if (lines.length) process.stdout.write(lines.join('') + '\n');
  }, ASYNC_FLUSH_MS);
  flushTimer.unref(); // don't prevent process exit
}

class AsyncTransport extends winston.Transport {
  constructor(opts = {}) {
    super(opts);
    this.name = 'async-console';
  }

  log(info, callback) {
    setImmediate(() => this.emit('logged', info));
    logBuffer.push(
      isProduction
        ? JSON.stringify(info) + '\n'
        : `${info.timestamp} [${info.level.toUpperCase()}] ${info.message}\n`
    );
    scheduleFlush();
    callback();
  }
}

export const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true })
  ),
  defaultMeta: { service: 'mujcode-backend' },
  transports: [
    new AsyncTransport()
  ]
});

// Flush remaining buffer on process exit
process.on('exit', () => {
  if (logBuffer.length) process.stdout.write(logBuffer.join('') + '\n');
});
