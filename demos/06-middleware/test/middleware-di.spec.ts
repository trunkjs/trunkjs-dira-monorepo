import { afterEach, describe, expect, it } from 'bun:test';
import { DiraCore, DiraHttpRequest, type DiraMiddleware } from '@dira/core';
import { Injectable, Cached } from '@dira/di';
import { HonoAdapter } from '@dira/adapter-hono';

/**
 * Test that middleware can use DI via request getters (e.g., req.logger)
 * just like handler functions do.
 */

// --- Services for testing DI ---

@Injectable()
class RequestLogger {
  private logs: string[] = [];

  log(message: string): void {
    this.logs.push(`[${new Date().toISOString()}] ${message}`);
  }

  getLogs(): string[] {
    return [...this.logs];
  }
}

@Injectable({ scope: 'singleton' })
class CounterService {
  private count = 0;

  increment(): number {
    return ++this.count;
  }

  getCount(): number {
    return this.count;
  }
}

/**
 * Custom request class that provides services as getters.
 * Middleware and handlers access services the same way: req.logger, req.counter
 */
class AppRequest<
  TBody = unknown,
  TQuery = Record<string, string | string[] | undefined>,
  TParams = Record<string, string>,
> extends DiraHttpRequest<TBody, TQuery, TParams> {
  @Cached()
  get logger(): RequestLogger {
    return this.newInstanceOf(RequestLogger);
  }

  @Cached()
  get counter(): CounterService {
    return this.newInstanceOf(CounterService);
  }
}

/**
 * Helper type alias for app-specific middleware.
 * With DiraCore<AppRequest>, handlers get properly typed requests,
 * but middleware still needs explicit typing since it can be used
 * across different request classes.
 */
type AppMiddleware<
  TIn extends Record<string, unknown> = Record<string, never>,
  TOut extends TIn = TIn,
> = DiraMiddleware<TIn, TOut, AppRequest>;

// --- Tests ---

describe('Middleware DI Integration', () => {
  let adapter: HonoAdapter;

  afterEach(() => {
    adapter?.stop();
  });

  it('should access services via request getters in middleware', async () => {
    adapter = new HonoAdapter();

    /**
     * With DiraCore<AppRequest>, middleware registered via .use() is
     * properly typed to receive AppRequest, giving you access to
     * req.logger, req.counter, etc. without casts.
     */
    const loggingMiddleware: AppMiddleware = async (req, next) => {
      req.logger.log('Middleware before'); // Properly typed with AppRequest!
      return next();
    };

    // Chain setRequestClass() to get DiraCore<AppRequest> with full type safety
    const dira = new DiraCore()
      .setRequestClass(AppRequest)
      .use(loggingMiddleware);

    dira.registerHandler('/test', (req) => {
      // req is now typed as AppRequest - no cast needed!
      req.logger.log('Handler executed');
      return {
        status: 'ok',
        logs: req.logger.getLogs(),
      };
    });

    await dira.run(adapter, { port: 0 });
    const baseUrl = `http://${adapter.hostname}:${adapter.port}`;

    const res = await fetch(`${baseUrl}/test`);
    expect(res.status).toBe(200);

    const body = await res.json();
    // Handler sees logs from middleware (before) and itself
    expect(body.logs.length).toBe(2);
    expect(body.logs[0]).toContain('Middleware before');
    expect(body.logs[1]).toContain('Handler executed');
  });

  it('should share singleton services between middleware and handler', async () => {
    adapter = new HonoAdapter();

    const mw1: AppMiddleware = async (req, next) => {
      req.counter.increment();
      return next();
    };

    const mw2: AppMiddleware = async (req, next) => {
      req.counter.increment();
      return next();
    };

    const dira = new DiraCore()
      .setRequestClass(AppRequest)
      .use(mw1)
      .use(mw2);

    dira.registerHandler('/singleton-test', (req) => {
      req.counter.increment();
      return { count: req.counter.getCount() };
    });

    await dira.run(adapter, { port: 0 });
    const baseUrl = `http://${adapter.hostname}:${adapter.port}`;

    const res = await fetch(`${baseUrl}/singleton-test`);
    const body = await res.json();

    // Singleton service: all three increments accumulate
    expect(body.count).toBe(3);
  });

  it('should use @Cached to share transient service instance within request', async () => {
    adapter = new HonoAdapter();

    const mw1: AppMiddleware = async (req, next) => {
      req.logger.log('from mw1');
      return next();
    };

    const mw2: AppMiddleware = async (req, next) => {
      req.logger.log('from mw2');
      return next();
    };

    const dira = new DiraCore()
      .setRequestClass(AppRequest)
      .use(mw1)
      .use(mw2);

    dira.registerHandler('/cached-test', (req) => {
      req.logger.log('from handler');
      return { logs: req.logger.getLogs() };
    });

    await dira.run(adapter, { port: 0 });
    const baseUrl = `http://${adapter.hostname}:${adapter.port}`;

    const res = await fetch(`${baseUrl}/cached-test`);
    const body = await res.json();

    // @Cached ensures same logger instance throughout request
    expect(body.logs.length).toBe(3);
    expect(body.logs[0]).toContain('from mw1');
    expect(body.logs[1]).toContain('from mw2');
    expect(body.logs[2]).toContain('from handler');
  });

  it('should allow middleware to store computed values in context', async () => {
    adapter = new HonoAdapter();

    interface RequestContext {
      requestId: string;
      timestamp: number;
    }

    // Middleware stores request metadata in context and uses AppRequest services
    const contextMiddleware: AppMiddleware<
      Record<string, unknown>,
      Record<string, unknown> & RequestContext
    > = async (req, next) => {
      req.ctx.requestId = crypto.randomUUID();
      req.ctx.timestamp = Date.now();
      req.logger.log(`Request ${req.ctx.requestId} started`);
      return next();
    };

    const dira = new DiraCore()
      .setRequestClass(AppRequest)
      .use(contextMiddleware);

    dira.registerHandler('/context', (req) => {
      // Cast needed for context since TypeScript doesn't track middleware context types
      const ctx = req.ctx as unknown as RequestContext;
      req.logger.log('Handler executed');
      return {
        requestId: ctx.requestId,
        timestamp: ctx.timestamp,
        logs: req.logger.getLogs(),
      };
    });

    await dira.run(adapter, { port: 0 });
    const baseUrl = `http://${adapter.hostname}:${adapter.port}`;

    const res = await fetch(`${baseUrl}/context`);
    const body = await res.json();

    expect(typeof body.requestId).toBe('string');
    expect(typeof body.timestamp).toBe('number');
    expect(body.logs.length).toBe(2);
    expect(body.logs[0]).toContain('started');
    expect(body.logs[1]).toContain('Handler executed');
  });

  it('should work with multiple service dependencies', async () => {
    adapter = new HonoAdapter();

    // Middleware that uses both services - properly typed with AppMiddleware
    const auditMiddleware: AppMiddleware = async (req, next) => {
      req.counter.increment(); // Track request count
      req.logger.log(`Request #${req.counter.getCount()}`);
      return next();
    };

    const dira = new DiraCore()
      .setRequestClass(AppRequest)
      .use(auditMiddleware);

    dira.registerHandler('/audit', (req) => {
      // req is typed as AppRequest - direct access to services
      return {
        requestNumber: req.counter.getCount(),
        logs: req.logger.getLogs(),
      };
    });

    await dira.run(adapter, { port: 0 });
    const baseUrl = `http://${adapter.hostname}:${adapter.port}`;

    const res = await fetch(`${baseUrl}/audit`);
    const body = await res.json();

    expect(body.requestNumber).toBe(1);
    expect(body.logs[0]).toContain('Request #1');
  });
});
