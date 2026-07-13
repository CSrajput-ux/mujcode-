export class Router {
  constructor() {
    this.routes = [];
  }

  get(path, handler) {
    this.add('GET', path, handler);
  }

  post(path, handler) {
    this.add('POST', path, handler);
  }

  put(path, handler) {
    this.add('PUT', path, handler);
  }

  patch(path, handler) {
    this.add('PATCH', path, handler);
  }

  delete(path, handler) {
    this.add('DELETE', path, handler);
  }

  add(method, path, handler) {
    this.routes.push({ method, path, parts: splitPath(path), handler });
  }

  async handle(req, res, ctx, pathname) {
    const pathParts = splitPath(pathname);

    for (const route of this.routes) {
      if (route.method !== req.method) continue;

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
