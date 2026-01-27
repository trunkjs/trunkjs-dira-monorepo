import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { DiraCore } from '@dira/dira-core';
import { HonoAdapter } from '@dira/adapter-hono';
import { HelloController } from './hello-controller';

describe('HelloController', () => {
  const PORT = 3010;
  const BASE_URL = `http://localhost:${PORT}`;
  let adapter: HonoAdapter;

  beforeAll(async () => {
    const dira = new DiraCore();
    dira.registerController(new HelloController());

    adapter = new HonoAdapter();
    await adapter.start(dira['routes'], { port: PORT });
  });

  afterAll(() => {
    adapter.stop();
  });
  test('GET /api/hello returns greeting', async () => {
    const response = await fetch(`${BASE_URL}/api/hello`);
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toBe('Hello from decorator!');
  });

  test('GET /api/health returns status ok', async () => {
    const response = await fetch(`${BASE_URL}/api/health`);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ status: 'ok' });
  });
});
