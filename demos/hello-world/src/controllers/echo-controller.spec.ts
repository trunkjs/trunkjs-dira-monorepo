import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { DiraCore } from '@dira/dira-core';
import { HonoAdapter } from '@dira/adapter-hono';
import { EchoController } from './echo-controller';

describe('EchoController', () => {
  const PORT = 3011;
  const BASE_URL = `http://localhost:${PORT}`;
  let adapter: HonoAdapter;

  beforeAll(async () => {
    const dira = new DiraCore();
    dira.registerController(new EchoController());

    adapter = new HonoAdapter();
    await adapter.start(dira['routes'], { port: PORT });
  });

  afterAll(() => {
    adapter.stop();
  });
  test('GET /api/echo returns message from query param', async () => {
    const response = await fetch(`${BASE_URL}/api/echo?message=test123`);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ echo: 'test123' });
  });

  test('GET /api/echo returns default when no message', async () => {
    const response = await fetch(`${BASE_URL}/api/echo`);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ echo: 'no message' });
  });

  test('GET /api/time returns timestamp', async () => {
    const before = Date.now();
    const response = await fetch(`${BASE_URL}/api/time`);
    const json = await response.json();
    const after = Date.now();

    expect(response.status).toBe(200);
    expect(json.timestamp).toBeGreaterThanOrEqual(before);
    expect(json.timestamp).toBeLessThanOrEqual(after);
  });
});
