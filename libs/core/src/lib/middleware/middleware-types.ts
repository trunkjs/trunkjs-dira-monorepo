import type { DiraHttpRequest } from '../request/dira-http-request';

/** Function to call the next middleware or handler in the chain. */
export type MiddlewareNext = () => Promise<Response>;

/**
 * Core middleware signature with typed context augmentation.
 * Middleware receives the request with current context and can augment it.
 *
 * @template TContextIn - Expected context type coming in (from previous middleware)
 * @template TContextOut - Context type after this middleware runs (extends TContextIn)
 * @template TRequest - The request class type (defaults to DiraHttpRequest)
 *
 * @example
 * // Generic middleware (works with any request class)
 * const timingMiddleware: DiraMiddleware = async (req, next) => {
 *   const start = performance.now();
 *   const response = await next();
 *   console.log(`Request took ${performance.now() - start}ms`);
 *   return response;
 * };
 *
 * @example
 * // App-specific middleware with custom request class
 * const loggingMiddleware: DiraMiddleware<{}, {}, AppRequest> = async (req, next) => {
 *   req.logger.log('Request started');  // Properly typed!
 *   return next();
 * };
 */
export type DiraMiddleware<
  TContextIn extends Record<string, unknown> = Record<string, never>,
  TContextOut extends TContextIn = TContextIn,
  TRequest extends DiraHttpRequest = DiraHttpRequest,
> = (
  request: TRequest & { ctx: TContextIn & Partial<TContextOut> },
  next: MiddlewareNext,
) => Promise<Response> | Response;

/**
 * Factory pattern for DI-aware middleware.
 * Returns a middleware function after receiving the request for DI resolution.
 */
export type DiraMiddlewareFactory<
  TContextIn extends Record<string, unknown> = Record<string, never>,
  TContextOut extends TContextIn = TContextIn,
  TRequest extends DiraHttpRequest = DiraHttpRequest,
> = (request: TRequest) => DiraMiddleware<TContextIn, TContextOut, TRequest>;

/**
 * Any middleware function signature for storage purposes.
 * Uses `any` to accept middleware with any context types.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyDiraMiddleware = DiraMiddleware<any, any, any>;

/**
 * Any middleware factory signature for storage purposes.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyDiraMiddlewareFactory = DiraMiddlewareFactory<any, any, any>;

/** Descriptor for storing middleware configuration. */
export interface MiddlewareDescriptor {
  /** The middleware function or factory. */
  middleware: AnyDiraMiddleware | AnyDiraMiddlewareFactory;
  /** Optional name for debugging/logging. */
  name?: string;
}
