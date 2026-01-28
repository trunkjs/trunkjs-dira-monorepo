import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { DiraCore } from '@dira/dira-core';
import { HonoAdapter } from '@dira/adapter-hono';

describe('Imperative API', () => {
  const PORT = 3015;
  const BASE_URL = `http://localhost:${PORT}`;
  let adapter: HonoAdapter;

  beforeAll(async () => {
    const dira = new DiraCore();

    // Register routes using imperative API (no decorators)
    dira.registerHandler('/ping', () => {
      return new Response('pong');
    });

    dira.registerHandler('/greet', (req) => {
      const name = req.query.name ?? 'World';
      return new Response(`Hello, ${name}!`);
    });

    dira.registerHandler('/json', () => {
      return { imperative: true };
    });

    adapter = new HonoAdapter();
    await adapter.start(dira['routes'], { port: PORT });
  });

  afterAll(() => {
    adapter.stop();
  });

  test('simple handler responds', async () => {
    const response = await fetch(`${BASE_URL}/ping`);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('pong');
  });

  test('handler receives request object', async () => {
    const response = await fetch(`${BASE_URL}/greet?name=Claude`);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('Hello, Claude!');
  });

  test('handler with default query param', async () => {
    const response = await fetch(`${BASE_URL}/greet`);
    expect(await response.text()).toBe('Hello, World!');
  });

  test('json response handler', async () => {
    const response = await fetch(`${BASE_URL}/json`);
    expect(response.headers.get('content-type')).toBe('application/json');

    const data = await response.json();
    expect(data).toEqual({ imperative: true });
  });
});

describe('Imperative API Chaining', () => {
  const PORT = 3016;
  const BASE_URL = `http://localhost:${PORT}`;
  let adapter: HonoAdapter;

  beforeAll(async () => {
    const dira = new DiraCore();

    // Test method chaining
    dira
      .registerHandler('/a', () => new Response('a'))
      .registerHandler('/b', () => new Response('b'))
      .registerHandler('/c', () => new Response('c'));

    adapter = new HonoAdapter();
    await adapter.start(dira['routes'], { port: PORT });
  });

  afterAll(() => {
    adapter.stop();
  });

  test('chained handlers all register correctly', async () => {
    const responses = await Promise.all([
      fetch(`${BASE_URL}/a`).then((r) => r.text()),
      fetch(`${BASE_URL}/b`).then((r) => r.text()),
      fetch(`${BASE_URL}/c`).then((r) => r.text()),
    ]);

    expect(responses).toEqual(['a', 'b', 'c']);
  });
});

describe('Mixed API (Imperative + Decorators)', () => {
  const PORT = 3017;
  const BASE_URL = `http://localhost:${PORT}`;
  let adapter: HonoAdapter;

  beforeAll(async () => {
    const { join } = await import('node:path');
    const dira = new DiraCore();

    // Mix imperative and decorator-based registration
    dira.registerHandler('/imperative', () => {
      return new Response('from imperative');
    });

    // Discover decorator-based controllers
    await dira.discover(join(import.meta.dirname, '../src/controllers'));

    // Add more imperative handlers after discovery
    dira.registerHandler('/also-imperative', () => {
      return new Response('also from imperative');
    });

    adapter = new HonoAdapter();
    await adapter.start(dira['routes'], { port: PORT });
  });

  afterAll(() => {
    adapter.stop();
  });

  test('imperative handlers work alongside discovered controllers', async () => {
    // Imperative routes
    const imperative1 = await fetch(`${BASE_URL}/imperative`);
    expect(await imperative1.text()).toBe('from imperative');

    const imperative2 = await fetch(`${BASE_URL}/also-imperative`);
    expect(await imperative2.text()).toBe('also from imperative');

    // Decorator-based routes
    const decorator = await fetch(`${BASE_URL}/api/hello`);
    expect(decorator.status).toBe(200);
  });

  test('routes maintain registration order', async () => {
    // All routes should be accessible regardless of registration method
    const endpoints = [
      '/imperative',
      '/api/hello',
      '/api/health',
      '/also-imperative',
    ];

    for (const endpoint of endpoints) {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      expect(response.status).toBe(200);
    }
  });
});

describe('Imperative API with Path Parameters', () => {
  const PORT = 3023;
  const BASE_URL = `http://localhost:${PORT}`;
  let adapter: HonoAdapter;

  beforeAll(async () => {
    const dira = new DiraCore();

    // Path params are auto-inferred from route pattern
    dira.registerHandler('/items/:id', (req) => {
      // req.params.id is typed as string (inferred from '/:id')
      return { itemId: req.params.id };
    });

    dira.registerHandler('/users/:userId/orders/:orderId', (req) => {
      // Both params are typed as string
      return {
        userId: req.params.userId,
        orderId: req.params.orderId,
      };
    });

    // Combining path params with query params
    dira.registerHandler('/products/:category', (req) => {
      return {
        category: req.params.category,
        sort: req.query.sort ?? 'default',
        limit: req.query.limit ?? '10',
      };
    });

    // Combining path params with request body
    dira.registerHandler('/resources/:id/update', async (req) => {
      const body = await req.json();
      return {
        id: req.params.id,
        updated: body,
      };
    });

    // Void return with path params
    dira.registerHandler('/logs/:level', () => {
      // Side effect only, no return
    });

    adapter = new HonoAdapter();
    await adapter.start(dira['routes'], { port: PORT });
  });

  afterAll(() => {
    adapter.stop();
  });

  test('extracts single path parameter', async () => {
    const response = await fetch(`${BASE_URL}/items/abc-123`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ itemId: 'abc-123' });
  });

  test('extracts multiple path parameters', async () => {
    const response = await fetch(`${BASE_URL}/users/u-42/orders/o-99`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      userId: 'u-42',
      orderId: 'o-99',
    });
  });

  test('combines path params with query params', async () => {
    const response = await fetch(
      `${BASE_URL}/products/electronics?sort=price&limit=20`,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      category: 'electronics',
      sort: 'price',
      limit: '20',
    });
  });

  test('combines path params with request body', async () => {
    const response = await fetch(`${BASE_URL}/resources/res-789/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated Name', active: true }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: 'res-789',
      updated: { name: 'Updated Name', active: true },
    });
  });

  test('void return with path params produces 204', async () => {
    const response = await fetch(`${BASE_URL}/logs/error`);

    expect(response.status).toBe(204);
  });

  test('handles URL-encoded path parameters', async () => {
    const response = await fetch(`${BASE_URL}/items/hello%2Fworld`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ itemId: 'hello/world' });
  });
});

describe('HTTP Method Binding', () => {
  const PORT = 3024;
  const BASE_URL = `http://localhost:${PORT}`;
  let adapter: HonoAdapter;

  beforeAll(async () => {
    const dira = new DiraCore();

    // Single method binding
    dira.registerHandler('/get-only', () => ({ method: 'GET' }), {
      method: 'GET',
    });

    dira.registerHandler('/post-only', () => ({ method: 'POST' }), {
      method: 'POST',
    });

    // Multiple method binding
    dira.registerHandler('/get-or-post', (req) => ({ method: req.method }), {
      method: ['GET', 'POST'],
    });

    // All methods (default - no method specified)
    dira.registerHandler('/any-method', (req) => ({ method: req.method }));

    adapter = new HonoAdapter();
    await adapter.start(dira['routes'], { port: PORT });
  });

  afterAll(() => {
    adapter.stop();
  });

  test('GET-only handler responds to GET', async () => {
    const response = await fetch(`${BASE_URL}/get-only`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ method: 'GET' });
  });

  test('GET-only handler rejects POST', async () => {
    const response = await fetch(`${BASE_URL}/get-only`, { method: 'POST' });
    expect(response.status).toBe(405);
  });

  test('POST-only handler responds to POST', async () => {
    const response = await fetch(`${BASE_URL}/post-only`, { method: 'POST' });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ method: 'POST' });
  });

  test('POST-only handler rejects GET', async () => {
    const response = await fetch(`${BASE_URL}/post-only`);
    expect(response.status).toBe(405);
  });

  test('multi-method handler responds to GET', async () => {
    const response = await fetch(`${BASE_URL}/get-or-post`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ method: 'GET' });
  });

  test('multi-method handler responds to POST', async () => {
    const response = await fetch(`${BASE_URL}/get-or-post`, { method: 'POST' });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ method: 'POST' });
  });

  test('multi-method handler rejects PUT', async () => {
    const response = await fetch(`${BASE_URL}/get-or-post`, { method: 'PUT' });
    expect(response.status).toBe(405);
  });

  test('default handler responds to any method', async () => {
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

    for (const method of methods) {
      const response = await fetch(`${BASE_URL}/any-method`, { method });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ method });
    }
  });
});

describe('Imperative API with Wildcard Parameters', () => {
  const PORT = 3027;
  const BASE_URL = `http://localhost:${PORT}`;
  let adapter: HonoAdapter;

  beforeAll(async () => {
    const dira = new DiraCore();

    // Wildcard param captures rest of path
    dira.registerHandler('/files/::filePath', (req) => {
      return { filePath: req.params.filePath };
    });

    // Combining regular and wildcard params
    dira.registerHandler('/buckets/:bucket/objects/::key', (req) => {
      return {
        bucket: req.params.bucket,
        key: req.params.key,
      };
    });

    adapter = new HonoAdapter();
    await adapter.start(dira['routes'], { port: PORT });
  });

  afterAll(() => {
    adapter.stop();
  });

  test('captures single segment wildcard', async () => {
    const response = await fetch(`${BASE_URL}/files/readme.txt`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ filePath: 'readme.txt' });
  });

  test('captures multi-segment wildcard path', async () => {
    const response = await fetch(`${BASE_URL}/files/path/to/file.txt`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ filePath: 'path/to/file.txt' });
  });

  test('captures deeply nested wildcard path', async () => {
    const response = await fetch(`${BASE_URL}/files/a/b/c/d/e/f.txt`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ filePath: 'a/b/c/d/e/f.txt' });
  });

  test('combines regular and wildcard params', async () => {
    const response = await fetch(
      `${BASE_URL}/buckets/my-bucket/objects/path/to/object.json`,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      bucket: 'my-bucket',
      key: 'path/to/object.json',
    });
  });

  test('decodes URL-encoded wildcard segments', async () => {
    const response = await fetch(`${BASE_URL}/files/my%20folder/my%20file.txt`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      filePath: 'my folder/my file.txt',
    });
  });
});
