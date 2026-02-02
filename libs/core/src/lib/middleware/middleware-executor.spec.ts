import { describe, expect, it } from 'bun:test';
import {
  composeMiddleware,
  createPassthroughChain,
} from './middleware-executor';
import { ContextStore } from './middleware-context';
import type { DiraMiddleware, MiddlewareDescriptor } from './middleware-types';

// Helper to create a mock request
function createMockRequest() {
  return {
    url: 'http://localhost/test',
    method: 'GET',
    headers: new Headers(),
    params: {},
    query: {},
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    formData: () => Promise.resolve(new FormData()),
    raw: new Request('http://localhost/test'),
    request: new Request('http://localhost/test'),
    newInstanceOf: () => ({}),
  } as any;
}

describe('composeMiddleware', () => {
  it('should call handler when no middleware', async () => {
    const handler = () => ({ data: 'test' });
    const chain = composeMiddleware([], handler);

    const response = await chain(createMockRequest());
    const body = await response.json();

    expect(body).toEqual({ data: 'test' });
  });

  it('should execute middleware in correct order (onion model)', async () => {
    const order: string[] = [];

    const mw1: DiraMiddleware = async (_req, next) => {
      order.push('mw1-before');
      const res = await next();
      order.push('mw1-after');
      return res;
    };

    const mw2: DiraMiddleware = async (_req, next) => {
      order.push('mw2-before');
      const res = await next();
      order.push('mw2-after');
      return res;
    };

    const handler = () => {
      order.push('handler');
      return { data: 'test' };
    };

    const chain = composeMiddleware(
      [{ middleware: mw1 }, { middleware: mw2 }],
      handler,
    );

    await chain(createMockRequest());

    expect(order).toEqual([
      'mw1-before',
      'mw2-before',
      'handler',
      'mw2-after',
      'mw1-after',
    ]);
  });

  it('should execute middleware in array order', async () => {
    const order: string[] = [];

    const mw1: DiraMiddleware = async (_req, next) => {
      order.push('mw1');
      return next();
    };

    const mw2: DiraMiddleware = async (_req, next) => {
      order.push('mw2');
      return next();
    };

    const mw3: DiraMiddleware = async (_req, next) => {
      order.push('mw3');
      return next();
    };

    const chain = composeMiddleware(
      [{ middleware: mw1 }, { middleware: mw2 }, { middleware: mw3 }],
      () => ({ data: 'test' }),
    );

    await chain(createMockRequest());

    expect(order).toEqual(['mw1', 'mw2', 'mw3']);
  });

  it('should allow middleware to short-circuit without calling next', async () => {
    const handlerCalled = { value: false };

    const authMiddleware: DiraMiddleware = async () => {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    };

    const chain = composeMiddleware([{ middleware: authMiddleware }], () => {
      handlerCalled.value = true;
      return { data: 'test' };
    });

    const response = await chain(createMockRequest());

    expect(response.status).toBe(401);
    expect(handlerCalled.value).toBe(false);
  });

  it('should allow middleware to modify the response', async () => {
    const timingMiddleware: DiraMiddleware = async (_req, next) => {
      const start = Date.now();
      const response = await next();
      const duration = Date.now() - start;
      const headers = new Headers(response.headers);
      headers.set('X-Response-Time', `${duration}ms`);
      return new Response(response.body, { ...response, headers });
    };

    const chain = composeMiddleware([{ middleware: timingMiddleware }], () => ({
      data: 'test',
    }));

    const response = await chain(createMockRequest());

    expect(response.headers.has('X-Response-Time')).toBe(true);
  });

  it('should attach context to request', async () => {
    let capturedCtx: any;

    const middleware: DiraMiddleware = async (req, next) => {
      (req.ctx as any).user = { id: '123' };
      return next();
    };

    const handler = (req: any) => {
      capturedCtx = req.ctx;
      return { data: 'test' };
    };

    const chain = composeMiddleware([{ middleware }], handler);
    await chain(createMockRequest());

    expect(capturedCtx.user).toEqual({ id: '123' });
  });

  it('should share context between middleware', async () => {
    let finalUserId: string | undefined;

    const mw1: DiraMiddleware = async (req, next) => {
      (req.ctx as any).userId = '123';
      return next();
    };

    const mw2: DiraMiddleware = async (req, next) => {
      finalUserId = (req.ctx as any).userId;
      return next();
    };

    const chain = composeMiddleware(
      [{ middleware: mw1 }, { middleware: mw2 }],
      () => ({ data: 'test' }),
    );

    await chain(createMockRequest());

    expect(finalUserId).toBe('123');
  });

  it('should use provided context store', async () => {
    const store = new ContextStore();
    store.set('preloaded', 'value');

    let capturedValue: string | undefined;

    const middleware: DiraMiddleware = async (req, next) => {
      capturedValue = (req.ctx as any).preloaded;
      return next();
    };

    const chain = composeMiddleware(
      [{ middleware }],
      () => ({ data: 'test' }),
      store,
    );

    await chain(createMockRequest());

    expect(capturedValue).toBe('value');
  });

  it('should handle handler returning Response directly', async () => {
    const handler = () => new Response('raw', { status: 201 });
    const chain = composeMiddleware([], handler);

    const response = await chain(createMockRequest());

    expect(response.status).toBe(201);
    expect(await response.text()).toBe('raw');
  });

  it('should handle handler returning Promise', async () => {
    const handler = async () => {
      await Promise.resolve();
      return { data: 'async' };
    };

    const chain = composeMiddleware([], handler);
    const response = await chain(createMockRequest());
    const body = await response.json();

    expect(body).toEqual({ data: 'async' });
  });

  it('should handle handler returning null (204 No Content)', async () => {
    const handler = () => null;
    const chain = composeMiddleware([], handler);

    const response = await chain(createMockRequest());

    expect(response.status).toBe(204);
  });

  it('should propagate errors through middleware chain', async () => {
    const errorMiddleware: DiraMiddleware = async () => {
      throw new Error('Test error');
    };

    const chain = composeMiddleware([{ middleware: errorMiddleware }], () => ({
      data: 'test',
    }));

    await expect(chain(createMockRequest())).rejects.toThrow('Test error');
  });

  it('should allow middleware to catch errors', async () => {
    const errorCatchingMiddleware: DiraMiddleware = async (_req, next) => {
      try {
        return await next();
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Caught' }), {
          status: 500,
        });
      }
    };

    const errorThrowingMiddleware: DiraMiddleware = async () => {
      throw new Error('Test error');
    };

    const chain = composeMiddleware(
      [
        { middleware: errorCatchingMiddleware },
        { middleware: errorThrowingMiddleware },
      ],
      () => ({ data: 'test' }),
    );

    const response = await chain(createMockRequest());

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: 'Caught' });
  });
});

describe('createPassthroughChain', () => {
  it('should execute handler directly', async () => {
    const handler = () => ({ data: 'test' });
    const chain = createPassthroughChain(handler);

    const response = await chain(createMockRequest());
    const body = await response.json();

    expect(body).toEqual({ data: 'test' });
  });

  it('should still attach context', async () => {
    let hasCtx = false;

    const handler = (req: any) => {
      hasCtx = 'ctx' in req;
      return { data: 'test' };
    };

    const chain = createPassthroughChain(handler);
    await chain(createMockRequest());

    expect(hasCtx).toBe(true);
  });
});
