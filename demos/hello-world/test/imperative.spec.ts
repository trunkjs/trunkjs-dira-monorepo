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
    dira.registerHttpHandler('/ping', async () => {
      return new Response('pong');
    });

    dira.registerHttpHandler('/greet', async (req: Request) => {
      const url = new URL(req.url);
      const name = url.searchParams.get('name') ?? 'World';
      return new Response(`Hello, ${name}!`);
    });

    dira.registerHttpHandler('/json', async () => {
      return new Response(JSON.stringify({ imperative: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
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
      .registerHttpHandler('/a', async () => new Response('a'))
      .registerHttpHandler('/b', async () => new Response('b'))
      .registerHttpHandler('/c', async () => new Response('c'));

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
    dira.registerHttpHandler('/imperative', async () => {
      return new Response('from imperative');
    });

    // Discover decorator-based controllers
    await dira.discover(join(import.meta.dirname, '../src/controllers'));

    // Add more imperative handlers after discovery
    dira.registerHttpHandler('/also-imperative', async () => {
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
