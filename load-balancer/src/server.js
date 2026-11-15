import http from 'node:http';
import https from 'node:https';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SOCKET_IO_PATH = /^\/socket\.io(?:\/|$)/;
const REQUEST_TIMEOUT_MS = 60_000;

export function parseBackends(value) {
  const entries = String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (entries.length < 2) {
    throw new Error('API_BACKENDS must contain at least two HTTPS backend URLs.');
  }

  const backends = entries.map((entry) => {
    const url = new URL(entry);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      throw new Error(`Invalid backend URL: ${entry}`);
    }

    return url;
  });

  if (new Set(backends.map((backend) => backend.origin)).size !== backends.length) {
    throw new Error('API_BACKENDS must contain unique backend URLs.');
  }

  return backends;
}

export function createBackendSelector(backends) {
  let nextBackendIndex = 0;

  return (req) => {
    const requestPath = new URL(req.url, 'http://localhost').pathname;
    if (SOCKET_IO_PATH.test(requestPath)) {
      const forwardedFor = req.headers['x-forwarded-for'];
      const clientAddress = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)
        ?.split(',')[0]
        .trim() || req.socket.remoteAddress || '';

      let hash = 0;
      for (let index = 0; index < clientAddress.length; index += 1) {
        hash = (hash * 31 + clientAddress.charCodeAt(index)) >>> 0;
      }

      return backends[hash % backends.length];
    }

    const backend = backends[nextBackendIndex];
    nextBackendIndex = (nextBackendIndex + 1) % backends.length;
    return backend;
  };
}

function getForwardedHeaders(req, backend) {
  const headers = { ...req.headers, host: backend.host };
  const forwardedFor = req.headers['x-forwarded-for'];
  const clientAddress = req.socket.remoteAddress || '';

  headers['x-forwarded-for'] = forwardedFor
    ? `${forwardedFor}, ${clientAddress}`
    : clientAddress;
  headers['x-forwarded-host'] = req.headers.host || '';
  headers['x-forwarded-proto'] = req.headers['x-forwarded-proto'] || 'https';

  return headers;
}

function writeUpgradeResponse(socket, response, head = Buffer.alloc(0)) {
  const statusLine = `HTTP/1.1 ${response.statusCode} ${response.statusMessage || ''}\r\n`;
  const headers = [];

  for (const [name, value] of Object.entries(response.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) headers.push(`${name}: ${item}\r\n`);
    } else if (value !== undefined) {
      headers.push(`${name}: ${value}\r\n`);
    }
  }

  socket.write(`${statusLine}${headers.join('')}\r\n`);
  if (head.length) socket.write(head);
}

export function createLoadBalancer(backends) {
  if (!Array.isArray(backends) || backends.length < 2) {
    throw new Error('At least two backend URLs are required.');
  }

  const selectBackend = createBackendSelector(backends);
  const agents = new Map(
    backends.map((backend) => [
      backend.origin,
      backend.protocol === 'https:'
        ? new https.Agent({ keepAlive: true, maxSockets: 256 })
        : new http.Agent({ keepAlive: true, maxSockets: 256 })
    ])
  );

  const server = http.createServer((req, res) => {
    const requestPath = new URL(req.url, 'http://localhost').pathname;
    if (requestPath === '/healthz') {
      res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    const backend = selectBackend(req);
    const transport = backend.protocol === 'https:' ? https : http;
    const upstreamRequest = transport.request(
      {
        protocol: backend.protocol,
        hostname: backend.hostname,
        port: backend.port || undefined,
        method: req.method,
        path: req.url,
        headers: getForwardedHeaders(req, backend),
        agent: agents.get(backend.origin)
      },
      (upstreamResponse) => {
        res.writeHead(
          upstreamResponse.statusCode || 502,
          upstreamResponse.statusMessage,
          upstreamResponse.headers
        );
        upstreamResponse.pipe(res);
      }
    );

    upstreamRequest.setTimeout(REQUEST_TIMEOUT_MS, () => {
      upstreamRequest.destroy(new Error('Backend request timed out.'));
    });
    upstreamRequest.on('error', (error) => {
      console.error(`Backend request failed (${backend.origin}): ${error.message}`);
      if (!res.headersSent) {
        res.writeHead(502, { 'content-type': 'application/json', 'cache-control': 'no-store' });
        res.end(JSON.stringify({ error: 'Backend unavailable' }));
      } else {
        res.destroy(error);
      }
    });

    req.pipe(upstreamRequest);
  });

  server.on('upgrade', (req, socket, head) => {
    const backend = selectBackend(req);
    const transport = backend.protocol === 'https:' ? https : http;
    const upstreamRequest = transport.request({
      protocol: backend.protocol,
      hostname: backend.hostname,
      port: backend.port || undefined,
      method: req.method,
      path: req.url,
      headers: getForwardedHeaders(req, backend),
      agent: agents.get(backend.origin)
    });

    upstreamRequest.setTimeout(REQUEST_TIMEOUT_MS, () => {
      upstreamRequest.destroy(new Error('Backend WebSocket connection timed out.'));
    });
    upstreamRequest.on('upgrade', (upstreamResponse, upstreamSocket, upstreamHead) => {
      writeUpgradeResponse(socket, upstreamResponse, upstreamHead);
      if (head.length) upstreamSocket.write(head);

      socket.setTimeout(0);
      upstreamSocket.setTimeout(0);
      socket.pipe(upstreamSocket).pipe(socket);
      socket.on('close', () => upstreamSocket.destroy());
      upstreamSocket.on('close', () => socket.destroy());
      socket.on('error', () => upstreamSocket.destroy());
      upstreamSocket.on('error', () => socket.destroy());
    });
    upstreamRequest.on('response', (upstreamResponse) => {
      writeUpgradeResponse(socket, upstreamResponse);
      upstreamResponse.pipe(socket);
    });
    upstreamRequest.on('error', (error) => {
      console.error(`Backend WebSocket failed (${backend.origin}): ${error.message}`);
      if (!socket.destroyed) {
        socket.end('HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\n\r\n');
      }
    });

    upstreamRequest.end();
  });

  server.on('close', () => {
    for (const agent of agents.values()) agent.destroy();
  });

  return server;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const backends = parseBackends(process.env.API_BACKENDS);
  const port = Number(process.env.PORT || 10000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid TCP port.');
  }

  const server = createLoadBalancer(backends);
  server.listen(port, '0.0.0.0', () => {
    console.log(`MujCode API load balancer listening on port ${port} (${backends.length} backends).`);
  });

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      server.close(() => process.exit(0));
    });
  }
}
