import assert from 'node:assert/strict';
import net from 'node:net';
import test from 'node:test';
import { createServer } from 'node:http';
import {
  createBackendSelector,
  createLoadBalancer,
  parseBackends
} from '../src/server.js';

test('parseBackends requires at least two unique HTTPS URLs', () => {
  assert.throws(() => parseBackends('https://one.example.com'), /at least two/);
  assert.throws(
    () => parseBackends('https://one.example.com,https://one.example.com/'),
    /unique/
  );
  assert.throws(
    () => parseBackends('http://one.example.com,https://two.example.com'),
    /Invalid backend URL/
  );
});

test('API requests use round-robin selection and Socket.IO stays on one backend per client IP', () => {
  const backends = parseBackends('https://one.example.com,https://two.example.com');
  const selectBackend = createBackendSelector(backends);
  const apiRequest = { url: '/api/ping', headers: {}, socket: { remoteAddress: 'client-a' } };
  const socketRequest = {
    url: '/socket.io/?EIO=4&transport=polling',
    headers: { 'x-forwarded-for': 'client-a' },
    socket: { remoteAddress: 'proxy' }
  };

  assert.deepEqual(
    [selectBackend(apiRequest).hostname, selectBackend(apiRequest).hostname],
    ['one.example.com', 'two.example.com']
  );
  assert.equal(selectBackend(socketRequest), selectBackend(socketRequest));
});

test('load balancer proxies HTTP requests and exposes a health endpoint', async (t) => {
  const backends = [];
  const backendServers = [];

  for (const name of ['one', 'two']) {
    const backend = createServer((req, res) => {
      res.writeHead(200, { 'content-type': 'text/plain' });
      res.end(name);
    });
    await new Promise((resolve) => backend.listen(0, '127.0.0.1', resolve));
    backendServers.push(backend);
    backends.push(new URL(`http://127.0.0.1:${backend.address().port}`));
  }

  const balancer = createLoadBalancer(backends);
  await new Promise((resolve) => balancer.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    await Promise.all(
      [balancer, ...backendServers].map(
        (server) => new Promise((resolve) => server.close(resolve))
      )
    );
  });

  const baseUrl = `http://127.0.0.1:${balancer.address().port}`;
  const responses = await Promise.all([
    fetch(`${baseUrl}/api/first`),
    fetch(`${baseUrl}/api/second`)
  ]);
  assert.deepEqual(
    await Promise.all(responses.map((response) => response.text())),
    ['one', 'two']
  );

  const health = await fetch(`${baseUrl}/healthz`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok' });
});

test('load balancer proxies WebSocket upgrades', async (t) => {
  const backends = [];
  const backendServers = [];

  for (const name of ['one', 'two']) {
    const backend = createServer();
    backend.on('upgrade', (_req, socket) => {
      socket.write(
        'HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n\r\n'
      );
    });
    await new Promise((resolve) => backend.listen(0, '127.0.0.1', resolve));
    backendServers.push(backend);
    backends.push(new URL(`http://127.0.0.1:${backend.address().port}`));
  }

  const balancer = createLoadBalancer(backends);
  await new Promise((resolve) => balancer.listen(0, '127.0.0.1', resolve));
  const activeSockets = new Set();
  for (const server of [balancer, ...backendServers]) {
    server.on('connection', (socket) => {
      activeSockets.add(socket);
      socket.on('close', () => activeSockets.delete(socket));
    });
  }
  t.after(async () => {
    for (const socket of activeSockets) socket.destroy();
    await Promise.all(
      [balancer, ...backendServers].map(
        (server) => new Promise((resolve) => server.close(resolve))
      )
    );
  });

  const response = await new Promise((resolve, reject) => {
    const socket = net.connect(balancer.address().port, '127.0.0.1');
    let responseText = '';
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error('WebSocket upgrade timed out.'));
    }, 5000);

    socket.on('connect', () => {
      socket.write(
        'GET /socket.io/?EIO=4&transport=websocket HTTP/1.1\r\n' +
          'Host: localhost\r\n' +
          'Connection: Upgrade\r\n' +
          'Upgrade: websocket\r\n' +
          'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n' +
          'Sec-WebSocket-Version: 13\r\n' +
          'X-Forwarded-For: 192.0.2.15\r\n\r\n'
      );
    });
    socket.on('data', (chunk) => {
      responseText += chunk.toString();
      if (responseText.includes('\r\n\r\n')) {
        clearTimeout(timer);
        socket.destroy();
        resolve(responseText);
      }
    });
    socket.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });

  assert.match(response, /^HTTP\/1\.1 101 Switching Protocols/);
});
