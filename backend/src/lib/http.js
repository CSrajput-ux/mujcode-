import { parseMultipart } from './multipart.js';

export function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

export function sendText(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

export async function parseBody(req) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return {};
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const buffer = Buffer.concat(chunks);
  if (!buffer.length) return {};

  const contentType = req.headers['content-type'] || '';

  if (contentType.includes('application/json')) {
    return JSON.parse(buffer.toString('utf8') || '{}');
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(buffer.toString('utf8')));
  }

  if (contentType.includes('multipart/form-data')) {
    return parseMultipart(buffer, contentType);
  }

  return { raw: buffer.toString('utf8') };
}

export function ok(res, data = {}, status = 200) {
  return sendJson(res, status, { success: true, ...data });
}

export function created(res, data = {}) {
  return ok(res, data, 201);
}

export function badRequest(res, error) {
  return sendJson(res, 400, { error });
}

export function notFound(res, error = 'Not found') {
  return sendJson(res, 404, { error });
}
