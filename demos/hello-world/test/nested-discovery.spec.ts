import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { join } from 'node:path';
import { DiraCore } from '@dira/dira-core';
import { HonoAdapter } from '@dira/adapter-hono';

describe('Nested Directory Discovery', () => {
  let adapter: HonoAdapter;
  let BASE_URL: string;

  beforeAll(async () => {
    const dira = new DiraCore();

    // Discover controllers from nested directory
    await dira.discover(join(import.meta.dirname, '../src/controllers/admin'));

    adapter = new HonoAdapter();
    const { port, hostname } = await adapter.start(dira['routes'], { port: 0 });
    BASE_URL = `http://${hostname}:${port}`;
  });

  afterAll(() => {
    adapter.stop();
  });

  test('discovers controllers from nested directory', async () => {
    const response = await fetch(`${BASE_URL}/admin/status`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({ admin: true, active: true });
  });

  test('all nested controller endpoints work', async () => {
    const endpoints = ['/admin/status', '/admin/users'];

    for (const endpoint of endpoints) {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      expect(response.status).toBe(200);
    }
  });
});

describe('Multiple Directory Discovery', () => {
  let adapter: HonoAdapter;
  let BASE_URL: string;

  beforeAll(async () => {
    const dira = new DiraCore();

    // Discover from multiple directories (non-recursive to avoid duplicates)
    await dira.discover(join(import.meta.dirname, '../src/controllers'), {
      recursive: false,
    });
    await dira.discover(join(import.meta.dirname, '../src/controllers/admin'));

    adapter = new HonoAdapter();
    const { port, hostname } = await adapter.start(dira['routes'], { port: 0 });
    BASE_URL = `http://${hostname}:${port}`;
  });

  afterAll(() => {
    adapter.stop();
  });

  test('combines routes from multiple discovery calls', async () => {
    // Routes from main controllers directory
    const helloResponse = await fetch(`${BASE_URL}/api/hello`);
    expect(helloResponse.status).toBe(200);

    // Routes from nested admin directory
    const adminResponse = await fetch(`${BASE_URL}/admin/status`);
    expect(adminResponse.status).toBe(200);
  });

  test('all endpoints from both directories respond', async () => {
    const endpoints = [
      '/api/hello',
      '/api/health',
      '/api/echo',
      '/api/time',
      '/admin/status',
      '/admin/users',
    ];

    for (const endpoint of endpoints) {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      expect(response.status).toBe(200);
    }
  });
});
