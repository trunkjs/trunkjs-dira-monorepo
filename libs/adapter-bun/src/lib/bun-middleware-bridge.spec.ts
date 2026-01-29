import { describe, expect, it } from 'bun:test';
import { DiraCore } from '@dira/core';
import { BunAdapter, type BunMiddleware } from '../index';

describe('BunMiddlewareBridge', () => {
  it('should be accessible from adapter.middlewareBridge', () => {
    const adapter = new BunAdapter();
    expect(adapter.middlewareBridge).toBeDefined();
    expect(typeof adapter.middlewareBridge.bridge).toBe('function');
  });

  it('should bridge Bun middleware to Dira middleware', () => {
    const adapter = new BunAdapter();

    // Create a simple Bun-style middleware
    const bunMiddleware: BunMiddleware = async (_req, next) => {
      return next();
    };

    const bridged = adapter.middlewareBridge.bridge(bunMiddleware);
    expect(typeof bridged).toBe('function');
  });

  it('should work end-to-end with DiraCore', async () => {
    const adapter = new BunAdapter();
    const callOrder: string[] = [];

    // Create a Bun-style middleware that logs
    const loggingMiddleware: BunMiddleware = async (_req, next) => {
      callOrder.push('bun-before');
      const response = await next();
      callOrder.push('bun-after');
      return response;
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
      expect(callOrder).toEqual(['bun-before', 'handler', 'bun-after']);
    } finally {
      adapter.stop();
    }
  });

  it('should allow Bun middleware to short-circuit', async () => {
    const adapter = new BunAdapter();

    // Middleware that returns early without calling next
    const authMiddleware: BunMiddleware = async (req, _next) => {
      const auth = req.headers.get('authorization');
      if (!auth) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      // Never call next() - always returns 401 for this test
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
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

  it('should allow modifying response headers', async () => {
    const adapter = new BunAdapter();

    // Middleware that adds a custom header to the response
    const headerMiddleware: BunMiddleware = async (_req, next) => {
      const response = await next();
      const newHeaders = new Headers(response.headers);
      newHeaders.set('X-Custom-Header', 'from-bun-middleware');
      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });
    };

    const dira = new DiraCore().use(
      adapter.middlewareBridge.bridge(headerMiddleware),
    );

    dira.registerHandler('/test', () => ({ data: 'test' }));

    await dira.run(adapter, { port: 0 });

    try {
      const res = await fetch(
        `http://${adapter.hostname}:${adapter.port}/test`,
      );
      expect(res.status).toBe(200);
      expect(res.headers.get('X-Custom-Header')).toBe('from-bun-middleware');
    } finally {
      adapter.stop();
    }
  });
});
