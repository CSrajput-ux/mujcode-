import http from 'node:http';
import { createApp } from '../src/app.js';
import { redis } from '../src/config/redis.js';

let server = null;
let port = 5099;
const baseUrl = `http://localhost:${port}`;

export async function startTestServer() {
  if (server) return { server, baseUrl };
  const app = await createApp();
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(port, resolve));
  return { server, baseUrl };
}

export async function stopTestServer() {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
    server = null;
  }
  try {
    redis.disconnect();
  } catch (e) {}
}

export async function apiRequest(method, path, body = null, headers = {}) {
  const url = `${baseUrl}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  if (body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const startTime = Date.now();
  let response, responseText, responseJson = null;
  try {
    response = await fetch(url, options);
    responseText = await response.text();
    try {
      responseJson = JSON.parse(responseText);
    } catch {
      responseJson = null;
    }
  } catch (err) {
    const duration = Date.now() - startTime;
    return {
      status: 0,
      headers: {},
      duration,
      error: err.message,
      body: null,
      rawText: null
    };
  }

  const duration = Date.now() - startTime;
  const respHeaders = {};
  response.headers.forEach((val, key) => { respHeaders[key] = val; });

  return {
    status: response.status,
    headers: respHeaders,
    duration,
    body: responseJson,
    rawText: responseText
  };
}

export const results = [];

export function recordTest(tc) {
  results.push({
    ...tc,
    timestamp: new Date().toISOString()
  });
  const statusEmoji = tc.result === 'PASS' ? '✅' : tc.result === 'FAIL' ? '❌' : '⚠️';
  console.log(`[${tc.result}] ${tc.testId}: ${tc.feature} - ${tc.summary} (${tc.duration || 0}ms)`);
  if (tc.result === 'FAIL' && tc.errorMessage) {
    console.log(`    ↳ Error: ${tc.errorMessage}`);
  }
}
