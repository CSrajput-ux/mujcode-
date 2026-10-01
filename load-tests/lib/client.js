import http from 'node:http';

const agent = new http.Agent({
  keepAlive: true,
  maxSockets: 1000,
  maxFreeSockets: 256,
  timeout: 30000
});

export async function httpRequest({
  baseUrl = 'http://127.0.0.1:5000',
  path = '/',
  method = 'GET',
  headers = {},
  body = null,
  timeoutMs = 15000
}) {
  const url = new URL(path, baseUrl);
  const start = process.hrtime.bigint();

  return new Promise((resolve) => {
    let payload = null;
    const reqHeaders = { ...headers };

    if (body !== null && body !== undefined) {
      payload = typeof body === 'string' ? body : JSON.stringify(body);
      reqHeaders['Content-Type'] = reqHeaders['Content-Type'] || 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const options = {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: reqHeaders,
      agent,
      timeout: timeoutMs
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.setEncoding('utf8');

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
        let parsed = null;
        const contentType = res.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
        } else {
          parsed = data;
        }

        resolve({
          statusCode: res.statusCode,
          status: res.statusCode,
          ok: res.statusCode >= 200 && res.statusCode < 400,
          headers: res.headers,
          data: parsed,
          rawBody: data,
          latencyMs: durationMs,
          error: null
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      resolve({
        statusCode: 504,
        status: 504,
        ok: false,
        headers: {},
        data: null,
        latencyMs: durationMs,
        error: new Error('TIMEOUT')
      });
    });

    req.on('error', (err) => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      resolve({
        statusCode: 500,
        status: 500,
        ok: false,
        headers: {},
        data: null,
        latencyMs: durationMs,
        error: err
      });
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}
