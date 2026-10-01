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
        : `${info.timestamp} [${info.level.toUpperCase()}] ${info.message}${info.stack ? '\n' + info.stack : ''}\n`
    );
    scheduleFlush();
    callback();
  }
}

const SENSITIVE_KEYS = new Set([
  'password', 'token', 'secret', 'authorization', 'cookie', 'jwt',
  'refreshtoken', 'accesstoken', 'creditcard', 'apikey', 'headers'
]);

function redactSensitive(obj, depth = 0) {
  if (depth > 6 || !obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(item => redactSensitive(item, depth + 1));
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(k.toLowerCase())) {
      out[k] = '[REDACTED]';
    } else if (typeof v === 'object' && v !== null) {
      out[k] = redactSensitive(v, depth + 1);
    } else {
      out[k] = v;
    }
  }
  return out;
}

const redactFormat = winston.format((info) => {
  return redactSensitive(info);
});

export const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    redactFormat()
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
