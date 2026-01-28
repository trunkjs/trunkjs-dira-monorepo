import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { DiraCore } from '@dira/dira-core';
import { HonoAdapter } from '@dira/adapter-hono';
import { AdminController } from './admin-controller';

describe('AdminController', () => {
  const PORT = 3018;
  const BASE_URL = `http://localhost:${PORT}`;
  let adapter: HonoAdapter;

  beforeAll(async () => {
    const dira = new DiraCore();
    dira.registerController(new AdminController());

    adapter = new HonoAdapter();
    await adapter.start(dira['routes'], { port: PORT });
  });

  afterAll(() => {
    adapter.stop();
  });

  test('GET /admin/status returns admin status', async () => {
    const response = await fetch(`${BASE_URL}/admin/status`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ admin: true, active: true });
  });

  test('GET /admin/users returns user list', async () => {
    const response = await fetch(`${BASE_URL}/admin/users`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ users: ['alice', 'bob'] });
  });
});
