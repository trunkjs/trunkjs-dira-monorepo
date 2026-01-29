import type { DiraMiddleware, MiddlewareBridge } from '@dira/core';

/**
 * Bun-style middleware signature.
 * Since Bun doesn't have a native middleware pattern, this defines a simple
 * request/next/response pattern similar to other frameworks.
 */
export type BunMiddleware = (
  request: Request,
  next: () => Promise<Response>,
) => Response | Promise<Response>;

/**
 * Bridge that converts Bun-style middleware to Dira middleware.
 * This allows using custom Bun middleware with Dira.
 *
 * @example
 * import { BunMiddlewareBridge } from '@dira/adapter-bun';
 *
 * const customMiddleware: BunMiddleware = async (req, next) => {
 *   console.log('Request:', req.url);
 *   const response = await next();
 *   console.log('Response:', response.status);
 *   return response;
 * };
 *
 * const bridge = new BunMiddlewareBridge();
 * const diraMiddleware = bridge.bridge(customMiddleware);
 *
 * const dira = new DiraCore()
 *   .use(diraMiddleware);
 */
export class BunMiddlewareBridge implements MiddlewareBridge<BunMiddleware> {
  /**
   * Converts a Bun-style middleware to a Dira middleware.
   * @param native - The Bun middleware to convert
   * @returns A Dira-compatible middleware
   */
  bridge(native: BunMiddleware): DiraMiddleware {
    return async (req, next) => {
      // Call the Bun middleware, passing the raw request and next function
      return native(req.request, next);
    };
  }
}
