import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { join } from 'node:path';
import { DiraCore, errorHandlerMiddleware } from '@dira/core';
import { HonoAdapter } from '@dira/adapter-hono';
import { timingMiddleware } from '../src/middleware/timing-middleware';
import { loggingMiddleware } from '../src/middleware/logging-middleware';

describe('Middleware Demo E2E', () => {
  let adapter: HonoAdapter;
  let baseUrl: string;

  beforeEach(async () => {
    const dira = new DiraCore()
      .use(errorHandlerMiddleware())
      .use(timingMiddleware)
      .use(loggingMiddleware);

    await dira.discover(join(import.meta.dirname, '../src/controllers'));

    adapter = new HonoAdapter();
    await dira.run(adapter, { port: 0 });
    baseUrl = `http://${adapter.hostname}:${adapter.port}`;
    console.log(`Server running at ${baseUrl}`);
  });

  afterEach(() => {
    adapter?.stop();
  });

  describe('Global middleware', () => {
    it('should add X-Response-Time header', async () => {
      const res = await fetch(`${baseUrl}/health`);
      expect(res.headers.has('X-Response-Time')).toBe(true);
      expect(res.headers.get('X-Response-Time')).toMatch(/^\d+\.\d+ms$/);
    });

    it('should add requestId to context', async () => {
      const res = await fetch(`${baseUrl}/health`);
      const body = await res.json();
      expect(body.requestId).toBeDefined();
      expect(typeof body.requestId).toBe('string');
    });

    it('should handle errors and return JSON', async () => {
      const res = await fetch(`${baseUrl}/api/me`);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Authentication required');
      expect(body.status).toBe(401);
    });
  });

  describe('Public endpoints', () => {
    it('GET /health returns status ok', async () => {
      const res = await fetch(`${baseUrl}/health`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('ok');
    });

    it('POST /echo echoes request body', async () => {
      const res = await fetch(`${baseUrl}/echo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'hello' }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.received).toEqual({ message: 'hello' });
    });
  });

  describe('Authentication middleware', () => {
    it('should return 401 without token', async () => {
      const res = await fetch(`${baseUrl}/api/me`);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Authentication required');
    });

    it('should return 401 with invalid token', async () => {
      const res = await fetch(`${baseUrl}/api/me`, {
        headers: { Authorization: 'Bearer invalid-token' },
      });
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Invalid token');
    });

    it('should succeed with valid user token', async () => {
      const res = await fetch(`${baseUrl}/api/me`, {
        headers: { Authorization: 'Bearer user-token' },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.user).toEqual({
        id: '2',
        name: 'Regular User',
        role: 'user',
      });
    });

    it('should succeed with valid admin token', async () => {
      const res = await fetch(`${baseUrl}/api/me`, {
        headers: { Authorization: 'Bearer admin-token' },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.user.role).toBe('admin');
    });
  });

  describe('Authorization middleware', () => {
    it('should return 403 for admin endpoint with user token', async () => {
      const res = await fetch(`${baseUrl}/api/admin/stats`, {
        headers: { Authorization: 'Bearer user-token' },
      });
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe('Forbidden');
      expect(body.details).toEqual({ required: 'admin', current: 'user' });
    });

    it('should succeed for admin endpoint with admin token', async () => {
      const res = await fetch(`${baseUrl}/api/admin/stats`, {
        headers: { Authorization: 'Bearer admin-token' },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.stats).toBeDefined();
      expect(body.stats.totalUsers).toBe(42);
    });
  });
});
