import { parseMultipart } from './multipart.js';
import zlib from 'node:zlib';

// ─── Pre-allocated response constants ─────────────────────────────────────────
// Avoid string allocation on every request for common headers
const JSON_CT  = 'application/json; charset=utf-8';
const TEXT_CT  = 'text/plain; charset=utf-8';

// ─── Compression threshold: only compress if body > 1KB ───────────────────────
// Small bodies cost MORE to compress (zlib overhead > savings)
const COMPRESS_MIN_BYTES = 1024;

function compressedSend(res, status, contentType, body) {
  const bodyBuf = typeof body === 'string' ? Buffer.from(body, 'utf8') : body;
  const accept  = res.req?.headers?.['accept-encoding'] ?? '';

  if (bodyBuf.length >= COMPRESS_MIN_BYTES) {
    if (accept.includes('br')) {
      zlib.brotliCompress(bodyBuf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 } }, (err, compressed) => {
        if (err) { fallbackSend(res, status, contentType, bodyBuf); return; }
        res.writeHead(status, {
          'Content-Type': contentType,
          'Content-Encoding': 'br',
          'Content-Length': compressed.length
        });
        res.end(compressed);
      });
      return;
    }
    if (accept.includes('gzip')) {
      zlib.gzip(bodyBuf, { level: zlib.constants.Z_BEST_SPEED }, (err, compressed) => {
        if (err) { fallbackSend(res, status, contentType, bodyBuf); return; }
        res.writeHead(status, {
          'Content-Type': contentType,
          'Content-Encoding': 'gzip',
          'Content-Length': compressed.length
        });
        res.end(compressed);
      });
      return;
    }
  }

  fallbackSend(res, status, contentType, bodyBuf);
}

function fallbackSend(res, status, contentType, bodyBuf) {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Content-Length': bodyBuf.length
  });
  res.end(bodyBuf);
}

export function sendJson(res, status, payload) {
  compressedSend(res, status, JSON_CT, JSON.stringify(payload));
}

export function sendText(res, status, body) {
  compressedSend(res, status, TEXT_CT, body);
}

export async function parseBody(req) {
  const method = req.method;
  // Fast check — GET/HEAD/OPTIONS never have a body
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return {};

  const MAX_PAYLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
  let totalBytes = 0;
  const chunks = [];

  for await (const chunk of req) {
    totalBytes += chunk.length;
    if (totalBytes > MAX_PAYLOAD_BYTES) {
      const err = new Error('Payload Too Large (exceeded 10MB limit)');
      err.status = 413;
      throw err;
    }
    chunks.push(chunk);
  }

  if (!chunks.length) return {};

  const buffer = Buffer.concat(chunks);
  const contentType = req.headers['content-type'] ?? '';

  // Use indexOf instead of includes — slightly faster for long strings
  if (contentType.indexOf('application/json') !== -1) {
    try {
      return JSON.parse(buffer);
    } catch {
      return {};
    }
  }

  if (contentType.indexOf('application/x-www-form-urlencoded') !== -1) {
    return Object.fromEntries(new URLSearchParams(buffer.toString('utf8')));
  }

  if (contentType.indexOf('multipart/form-data') !== -1) {
    return parseMultipart(buffer, contentType);
  }

  return { raw: buffer.toString('utf8') };
}

export function ok(res, data = {}, status = 200) {
  return sendJson(res, status, { success: true, ...data });
}

export function badRequest(res, error) {
  return sendJson(res, 400, { error });
}
