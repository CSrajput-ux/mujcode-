export class Router {
  constructor() {
    // Method-indexed map: 'GET' -> [ ...routes ]
    // Static routes stored separately for O(1) exact match
    this._byMethod = new Map();
    this._static   = new Map(); // 'GET:/api/foo' -> handler
  }

  get(path, handler)    { this.add('GET',    path, handler); }
  post(path, handler)   { this.add('POST',   path, handler); }
  put(path, handler)    { this.add('PUT',    path, handler); }
  patch(path, handler)  { this.add('PATCH',  path, handler); }
  delete(path, handler) { this.add('DELETE', path, handler); }

  add(method, path, handler) {
    const parts = splitPath(path);
    const isDynamic = parts.some(p => p.startsWith(':') || p === '*');

    if (!isDynamic) {
      // Pure static path — O(1) lookup
      this._static.set(`${method}:${path}`, handler);
      return;
    }

    if (!this._byMethod.has(method)) {
      this._byMethod.set(method, []);
    }
    this._byMethod.get(method).push({ path, parts, handler });
  }

  async handle(req, res, ctx, pathname) {
    const method = req.method;

    // 1. Fast O(1) static match
    const staticHandler = this._static.get(`${method}:${pathname}`);
    if (staticHandler) {
      req.params = {};
      await staticHandler(req, res, ctx);
      return true;
    }

    // 2. Dynamic routes — only scan routes for this HTTP method
    const dynamicRoutes = this._byMethod.get(method);
    if (!dynamicRoutes) return false;

    const pathParts = splitPath(pathname);
    for (const route of dynamicRoutes) {
      const params = matchParts(route.parts, pathParts);
      if (!params) continue;

      req.params = params;
      await route.handler(req, res, ctx);
      return true;
    }

    return false;
  }
}

function splitPath(path) {
  return path.split('/').filter(Boolean);
}

function matchParts(routeParts, pathParts) {
  const params = {};

  if (routeParts.at(-1) === '*') {
    if (pathParts.length < routeParts.length - 1) return null;
  } else if (routeParts.length !== pathParts.length) {
    return null;
  }

  for (let i = 0; i < routeParts.length; i += 1) {
    const expected = routeParts[i];
    const actual = pathParts[i];

    if (expected === '*') {
      params.wildcard = pathParts.slice(i).join('/');
      return params;
    }

    if (expected.startsWith(':')) {
      params[expected.slice(1)] = decodeURIComponent(actual);
      continue;
    }

    if (expected !== actual) return null;
  }

  return params;
}
