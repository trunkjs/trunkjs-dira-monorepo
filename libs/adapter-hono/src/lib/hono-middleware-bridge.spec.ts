import { describe, expect, it } from 'bun:test';
import { basicAuth } from 'hono/basic-auth';
import { DiraCore, type DiraMiddleware } from '@dira/core';
import { HonoAdapter, type HonoMiddleware } from '../index';

describe('HonoMiddlewareBridge', () => {
  it('should be accessible from adapter.middlewareBridge', () => {
    const adapter = new HonoAdapter();
    expect(adapter.middlewareBridge).toBeDefined();
    expect(typeof adapter.middlewareBridge.bridge).toBe('function');
  });

  it('should bridge Hono middleware to Dira middleware', async () => {
    const adapter = new HonoAdapter();

    // Create a simple Hono-style middleware
    const honoMiddleware: HonoMiddleware = async (c, next) => {
      // Add custom header before calling next
      await next();
      // Hono middleware can't easily modify response headers after next()
      // without context.res, so this tests the basic flow
    };

    const bridged = adapter.middlewareBridge.bridge(honoMiddleware);
    expect(typeof bridged).toBe('function');
  });

  it('should work end-to-end with DiraCore', async () => {
    const adapter = new HonoAdapter();
    const callOrder: string[] = [];

    // Create a Hono-style middleware that logs
    const loggingMiddleware: HonoMiddleware = async (_c, next) => {
      callOrder.push('hono-before');
      await next();
      callOrder.push('hono-after');
    };

    // Bridge it and use with DiraCore
    const dira = new DiraCore().use(
      adapter.middlewareBridge.bridge(loggingMiddleware),
    );

    dira.registerHandler('/test', () => {
      callOrder.push('handler');
      return { ok: true };
    });

    await dira.run(adapter, { port: 0 });

    try {
      const res = await fetch(
        `http://${adapter.hostname}:${adapter.port}/test`,
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toEqual({ ok: true });

      // Verify middleware executed in correct order (onion model)
      expect(callOrder).toEqual(['hono-before', 'handler', 'hono-after']);
    } finally {
      adapter.stop();
    }
  });

  it('should allow Hono middleware to short-circuit', async () => {
    const adapter = new HonoAdapter();

    // Middleware that returns early without calling next
    const authMiddleware: HonoMiddleware = async (c, _next) => {
      // Check for auth header
      const auth = c.req.header('authorization');
      if (!auth) {
        return c.json({ error: 'Unauthorized' }, 401);
      }
      // Without auth, we never call next()
      return c.json({ error: 'Unauthorized' }, 401);
    };

    const dira = new DiraCore().use(
      adapter.middlewareBridge.bridge(authMiddleware),
    );

    dira.registerHandler('/protected', () => {
      return { secret: 'data' };
    });

    await dira.run(adapter, { port: 0 });

    try {
      // Request without auth should be blocked
      const res = await fetch(
        `http://${adapter.hostname}:${adapter.port}/protected`,
      );
      expect(res.status).toBe(401);
    } finally {
      adapter.stop();
    }
  });

  describe('with real Hono basicAuth middleware', () => {
    it('should work with Hono basicAuth combined with Dira-native middleware', async () => {
      const adapter = new HonoAdapter();
      const callOrder: string[] = [];

      // Dira-native timing middleware
      const timingMiddleware: DiraMiddleware = async (req, next) => {
        callOrder.push('dira-timing-before');
        const start = performance.now();
        const response = await next();
        const duration = performance.now() - start;
        callOrder.push('dira-timing-after');

        // Add timing header to response
        const headers = new Headers(response.headers);
        headers.set('X-Response-Time', `${duration.toFixed(2)}ms`);
        return new Response(response.body, {
          status: response.status,
          headers,
        });
      };

      // Real Hono basicAuth middleware
      const honoBasicAuth = basicAuth({
        username: 'testuser',
        password: 'testpass',
      });

      // Combine Dira-native middleware with bridged Hono middleware
      const dira = new DiraCore()
        .use(timingMiddleware)
        .use(adapter.middlewareBridge.bridge(honoBasicAuth));

      dira.registerHandler('/protected', () => {
        callOrder.push('handler');
        return { secret: 'protected-data' };
      });

      await dira.run(adapter, { port: 0 });

      try {
        // Request without auth should be rejected by Hono basicAuth
        const unauthRes = await fetch(
          `http://${adapter.hostname}:${adapter.port}/protected`,
        );
        expect(unauthRes.status).toBe(401);
        expect(unauthRes.headers.get('WWW-Authenticate')).toContain('Basic');

        // Verify timing middleware still ran (before basicAuth short-circuited)
        expect(callOrder).toContain('dira-timing-before');
        expect(callOrder).toContain('dira-timing-after');
        expect(callOrder).not.toContain('handler'); // Handler should not have been called

        // Reset call order
        callOrder.length = 0;

        // Request with valid Basic auth should succeed
        const credentials = btoa('testuser:testpass');
        const authRes = await fetch(
          `http://${adapter.hostname}:${adapter.port}/protected`,
          {
            headers: {
              Authorization: `Basic ${credentials}`,
            },
          },
        );
        expect(authRes.status).toBe(200);
        expect(authRes.headers.get('X-Response-Time')).toBeDefined();

        const data = await authRes.json();
        expect(data).toEqual({ secret: 'protected-data' });

        // Verify correct execution order with onion model
        expect(callOrder).toEqual([
          'dira-timing-before',
          'handler',
          'dira-timing-after',
        ]);
      } finally {
        adapter.stop();
      }
    });

    it('should reject invalid credentials with Hono basicAuth', async () => {
      const adapter = new HonoAdapter();

      const honoBasicAuth = basicAuth({
        username: 'admin',
        password: 'secret123',
      });

      const dira = new DiraCore().use(
        adapter.middlewareBridge.bridge(honoBasicAuth),
      );

      dira.registerHandler('/admin', () => ({ admin: true }));

      await dira.run(adapter, { port: 0 });

      try {
        // Wrong password
        const wrongPass = btoa('admin:wrongpassword');
        const res = await fetch(
          `http://${adapter.hostname}:${adapter.port}/admin`,
          {
            headers: { Authorization: `Basic ${wrongPass}` },
          },
        );
        expect(res.status).toBe(401);

        // Wrong username
        const wrongUser = btoa('wronguser:secret123');
        const res2 = await fetch(
          `http://${adapter.hostname}:${adapter.port}/admin`,
          {
            headers: { Authorization: `Basic ${wrongUser}` },
          },
        );
        expect(res2.status).toBe(401);

        // Correct credentials
        const correct = btoa('admin:secret123');
        const res3 = await fetch(
          `http://${adapter.hostname}:${adapter.port}/admin`,
          {
            headers: { Authorization: `Basic ${correct}` },
          },
        );
        expect(res3.status).toBe(200);
      } finally {
        adapter.stop();
      }
    });
  });
});
