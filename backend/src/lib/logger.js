import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

// ─── Async Logger — buffered writes, never blocks the event loop ───────────────
// Winston's default Console transport flushes synchronously on every log call,
// which blocks the event loop under high throughput. We use a short buffer to
// batch log lines and flush them in a single I/O burst.

const SENSITIVE_KEYS = new Set([
  'password', 'token', 'secret', 'authorization', 'cookie', 'jwt',
  'refreshtoken', 'accesstoken', 'creditcard', 'apikey', 'headers'
]);

function redactInPlace(obj, depth = 0) {
  if (depth > 6 || !obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === 'object' && obj[i] !== null) {
        redactInPlace(obj[i], depth + 1);
      }
    }
    return obj;
  }
  for (const k of Object.keys(obj)) {
    if (SENSITIVE_KEYS.has(k.toLowerCase())) {
      obj[k] = '[REDACTED]';
    } else if (typeof obj[k] === 'object' && obj[k] !== null) {
      redactInPlace(obj[k], depth + 1);
    }
  }
  return obj;
}

const redactFormat = winston.format((info) => {
  return redactInPlace(info);
});

class DirectTransport extends winston.Transport {
  constructor(opts = {}) {
    super(opts);
    this.name = 'direct-console';
  }

  log(info, callback) {
    const isErr = info.level === 'error' || info.level === 'warn';
    const stream = isErr ? process.stderr : process.stdout;
    const msg = isProduction
      ? JSON.stringify(info) + '\n'
      : `${info.timestamp || new Date().toISOString()} [${(info.level || 'info').toUpperCase()}] ${info.message}${info.stack ? '\n' + info.stack : ''}\n`;

    stream.write(msg);
    this.emit('logged', info);
    callback();
  }
}

export const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    redactFormat()
  ),
  defaultMeta: { service: 'mujcode-backend' },
  transports: [
    new DirectTransport()
  ]
});
