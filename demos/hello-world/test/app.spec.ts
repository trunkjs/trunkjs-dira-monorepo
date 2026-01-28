import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { join } from 'node:path';
import { DiraCore } from '@dira/dira-core';
import { HonoAdapter } from '@dira/adapter-hono';

describe('App E2E', () => {
  let adapter: HonoAdapter;
  let BASE_URL: string;

  beforeAll(async () => {
    const dira = new DiraCore();
    await dira.discover(join(import.meta.dirname, '../src/controllers'));

    adapter = new HonoAdapter();
    const { port, hostname } = await adapter.start(dira['routes'], { port: 0 });
    BASE_URL = `http://${hostname}:${port}`;
  });

  afterAll(() => {
    adapter.stop();
  });
  test('all endpoints are discoverable and respond', async () => {
    const endpoints = ['/api/hello', '/api/health', '/api/echo', '/api/time'];

    for (const endpoint of endpoints) {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      expect(response.status).toBe(200);
    }
  });

  test('controllers are registered with correct prefixes', async () => {
    const response = await fetch(`${BASE_URL}/api/hello`);
    expect(response.status).toBe(200);

    const notFound = await fetch(`${BASE_URL}/hello`);
    expect(notFound.status).toBe(404);
  });
});
