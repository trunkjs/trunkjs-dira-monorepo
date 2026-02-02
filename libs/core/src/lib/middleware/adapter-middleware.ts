import type { DiraMiddleware } from './middleware-types';

/**
 * Bridge interface for converting adapter-native middleware to Dira middleware.
 * Adapters can implement this to allow using their ecosystem's middleware.
 *
 * @template TNativeMiddleware - The adapter's native middleware type
 *
 * @example
 * // Hono adapter bridge
 * class HonoMiddlewareBridge implements MiddlewareBridge<HonoMiddleware> {
 *   bridge(native: HonoMiddleware): DiraMiddleware {
 *     return async (req, next) => {
 *       // Convert and execute Hono middleware
 *       return next();
 *     };
 *   }
 * }
 *
 * // Usage with adapter
 * import { cors } from 'hono/cors';
 *
 * const adapter = new HonoAdapter();
 * const dira = new DiraCore()
 *   .use(adapter.middlewareBridge.bridge(cors()));
 */
export interface MiddlewareBridge<TNativeMiddleware = unknown> {
  /**
   * Converts a native adapter middleware to a Dira middleware.
   * @param native - The native middleware to convert
   * @returns A Dira-compatible middleware
   */
  bridge(native: TNativeMiddleware): DiraMiddleware;
}
