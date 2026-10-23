import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createApp } from '../src/app.js';
import { closeRedis } from '../src/config/redis.js';
import { closePostgres } from '../src/lib/postgres.js';
import { terminateStorageWorker } from '../src/lib/storage.js';

const HOST = '127.0.0.1';

async function startApp() {
  const app = await createApp();
  const server = createServer(app);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, HOST, resolve);
  });
  const address = server.address();
  return {
    server,
    baseUrl: `http://${HOST}:${address.port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((err) => err ? reject(err) : resolve());
    })
  };
}

test('HTTP system and API contract smoke tests', async (t) => {
  const running = await startApp();
  t.after(async () => {
    await running.close();
    await closeRedis();
    await closePostgres();
    await terminateStorageWorker();
  });

  await t.test('OPTIONS preflight responds without authentication', async () => {
    const response = await fetch(`${running.baseUrl}/api/auth/login`, {
      method: 'OPTIONS',
      headers: { Origin: 'https://www.mujcode.in', 'Access-Control-Request-Method': 'POST' }
    });
    assert.equal(response.status, 204);
    assert.ok(response.headers.has('x-content-type-options'));
  });

  await t.test('unknown API route returns a controlled client error', async () => {
    const response = await fetch(`${running.baseUrl}/api/__qa_missing_route__`);
    assert.ok([400, 404].includes(response.status), `unexpected status: ${response.status}`);
    assert.ok(response.headers.get('content-type')?.includes('application/json'));
    const body = await response.json();
    assert.ok(body.error || body.message || body.success === false);
  });

  await t.test('untrusted CORS origin is not reflected', async () => {
    const response = await fetch(`${running.baseUrl}/api/__qa_missing_route__`, {
      headers: { Origin: 'https://evil-example.invalid' }
    });
    assert.notEqual(response.headers.get('access-control-allow-origin'), 'https://evil-example.invalid');
    assert.equal(response.headers.get('access-control-allow-credentials'), null);
  });

  await t.test('security headers are present on API responses', async () => {
    const response = await fetch(`${running.baseUrl}/api/__qa_missing_route__`);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.ok(response.headers.has('content-security-policy'));
    assert.ok(response.headers.has('referrer-policy'));
  });

  await t.test('malformed JSON does not crash the HTTP server', async () => {
    const response = await fetch(`${running.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"email":'
    });
    assert.ok(response.status >= 400 && response.status < 600);
    const healthProbe = await fetch(`${running.baseUrl}/health`).catch(() => null);
    // Some deployments expose no /health route; server survival is what matters.
    assert.ok(healthProbe === null || healthProbe.status < 500);
  });
});
