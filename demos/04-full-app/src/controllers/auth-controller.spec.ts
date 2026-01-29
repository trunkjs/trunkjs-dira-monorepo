import { describe, expect, it, afterEach, beforeEach } from 'bun:test';
import { join } from 'node:path';
import { DiraCore } from '@dira/core';
import { HonoAdapter } from '@dira/adapter-hono';
import { AppRequest } from '../app-request';

describe('AuthController', () => {
  let adapter: HonoAdapter;
  let baseUrl: string;

  beforeEach(async () => {
    const dira = new DiraCore();
    dira.setRequestClass(AppRequest);
    await dira.discover(join(import.meta.dirname, '.'));
    adapter = new HonoAdapter();
    await dira.run(adapter, { port: 0 });
    baseUrl = `http://${adapter.hostname}:${adapter.port}`;
  });

  afterEach(() => {
    adapter?.stop();
  });

  it('login with valid credentials returns token', async () => {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin' }),
    });
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      token: string;
      expiresAt: string;
    };
    expect(body.token).toBeDefined();
    expect(body.expiresAt).toBeDefined();
  });

  it('login with invalid credentials returns 401', async () => {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'wrong', password: 'wrong' }),
    });
    expect(response.status).toBe(401);
  });

  it('me without token returns 401', async () => {
    const response = await fetch(`${baseUrl}/auth/me`);
    expect(response.status).toBe(401);
  });

  it('me with valid token returns user', async () => {
    // Login first
    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin' }),
    });
    const { token } = (await loginResponse.json()) as { token: string };

    // Get current user
    const meResponse = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(meResponse.status).toBe(200);

    const body = (await meResponse.json()) as {
      user: { name: string; role: string };
    };
    expect(body.user.name).toBe('Admin User');
    expect(body.user.role).toBe('admin');
  });

  it('logout invalidates token', async () => {
    // Login
    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'user', password: 'user' }),
    });
    const { token } = (await loginResponse.json()) as { token: string };

    // Verify token works
    const meResponse1 = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(meResponse1.status).toBe(200);

    // Logout
    const logoutResponse = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(logoutResponse.status).toBe(200);

    // Token should no longer work
    const meResponse2 = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(meResponse2.status).toBe(401);
  });
});
