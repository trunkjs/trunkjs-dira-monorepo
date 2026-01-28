import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { DiraCore, type RouteRegistration } from '@dira/dira-core';
import { HonoAdapter } from '@dira/adapter-hono';
import { AdminController } from './admin-controller';

describe('AdminController', () => {
  let adapter: HonoAdapter;
  let routes: RouteRegistration[];
  let BASE_URL: string;

  beforeAll(async () => {
    const dira = new DiraCore();
    dira.registerController(new AdminController());

    routes = dira['routes'];
    adapter = new HonoAdapter();
    const { port, hostname } = await adapter.start(routes, { port: 0 });
    BASE_URL = `http://${hostname}:${port}`;
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

  describe('route names for SDK generation', () => {
    test('routes have explicit names from decorators', () => {
      const names = routes.map((r) => r.name);
      expect(names).toContain('admin.get-status');
      expect(names).toContain('admin.list-users');
    });

    test('status route has correct name', () => {
      const statusRoute = routes.find((r) => r.route === '/admin/status');
      expect(statusRoute?.name).toBe('admin.get-status');
    });

    test('users route has correct name', () => {
      const usersRoute = routes.find((r) => r.route === '/admin/users');
      expect(usersRoute?.name).toBe('admin.list-users');
    });
  });
});
