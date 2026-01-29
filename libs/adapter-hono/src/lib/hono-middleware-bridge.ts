import type { Context, MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { DiraMiddleware, MiddlewareBridge } from '@dira/core';

/**
 * Hono middleware signature for reference.
 * Hono middleware receives (context, next) and can:
 * - Call next() to continue to the next middleware
 * - Return a Response to short-circuit
 * - Throw HTTPException to short-circuit with an error response
 * - Modify context.req or context.res
 */
export type HonoMiddleware = MiddlewareHandler;

/**
 * Bridge that converts native Hono middleware to Dira middleware.
 * This allows using Hono ecosystem middleware (cors, compress, etc.) with Dira.
 *
 * @example
 * import { cors } from 'hono/cors';
 * import { HonoMiddlewareBridge } from '@dira/adapter-hono';
 *
 * const bridge = new HonoMiddlewareBridge();
 * const diraCors = bridge.bridge(cors());
 *
 * const dira = new DiraCore()
 *   .use(diraCors);
 */
export class HonoMiddlewareBridge implements MiddlewareBridge<HonoMiddleware> {
  /**
   * Converts a Hono middleware to a Dira middleware.
   * @param native - The Hono middleware to convert
   * @returns A Dira-compatible middleware
   */
  bridge(native: HonoMiddleware): DiraMiddleware {
    return async (req, next) => {
      // Create a minimal Hono-like context
      // We need to mock just enough for the middleware to work
      let response: Response | undefined;

      const mockContext = {
        req: {
          raw: req.request,
          method: req.method,
          url: req.url,
          header: (name: string) => req.headers.get(name),
          headers: req.headers,
        },
        res: undefined as Response | undefined,
        set: {
          res: (r: Response) => {
            response = r;
          },
        },
        get res() {
          return response;
        },
        body: (data: unknown, status?: number) =>
          new Response(JSON.stringify(data), { status: status ?? 200 }),
        json: (data: unknown, status?: number) =>
          new Response(JSON.stringify(data), {
            status: status ?? 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        text: (text: string, status?: number) =>
          new Response(text, { status: status ?? 200 }),
        html: (html: string, status?: number) =>
          new Response(html, {
            status: status ?? 200,
            headers: { 'Content-Type': 'text/html' },
          }),
        redirect: (url: string, status?: number) =>
          Response.redirect(url, status ?? 302),
      } as unknown as Context;

      // Track if next() was called
      let nextCalled = false;
      let nextResult: Response | undefined;

      const honoNext = async () => {
        nextCalled = true;
        nextResult = await next();
      };

      try {
        // Execute the Hono middleware
        const result = await native(mockContext, honoNext);

        // If the middleware returned a Response, use it
        if (result instanceof Response) {
          return result;
        }

        // If the middleware set a response via context, use it
        if (response) {
          return response;
        }

        // If next() was called and returned a response, use it
        if (nextCalled && nextResult) {
          return nextResult;
        }

        // If next() was called, continue the chain
        if (nextCalled) {
          return next();
        }

        // Fallback: continue the chain (middleware didn't do anything)
        return next();
      } catch (error) {
        // Handle Hono's HTTPException (used by basicAuth, bearerAuth, etc.)
        if (error instanceof HTTPException) {
          return error.getResponse();
        }
        // Re-throw other errors to be handled by Dira's error middleware
        throw error;
      }
    };
  }
}
