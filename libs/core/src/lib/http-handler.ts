import type { DiraHttpRequest } from './request/dira-http-request';
import type { ExtractParams } from './types/extract-params';
import type { HandlerReturn } from './types/handler-return';

/**
 * Low-level handler type used internally by RouteRegistration and adapters.
 * Takes a raw Request and returns a raw Response.
 *
 * For user-facing handlers, use `DiraHandler` instead which provides
 * type-safe access to body, query, and path parameters via `DiraHttpRequest`.
 *
 * @internal
 */
export type HttpHandler = (req: Request) => Promise<Response>;

/**
 * Type-safe handler using DiraHttpRequest with auto-inferred path parameters.
 *
 * @template TRoute - Route pattern string (e.g., "/users/:id")
 * @template TBody - Expected request body type
 * @template TQuery - Expected query parameters shape
 * @template TReturn - Expected return value type
 * @template TRequest - Request class type (defaults to DiraHttpRequest)
 *
 * @example
 * // Basic handler with path params
 * const handler: DiraHandler<'/users/:id'> = (req) => {
 *   const userId = req.params.id;  // Typed as string
 *   return { userId };
 * };
 *
 * @example
 * // Handler with custom request class
 * const handler: DiraHandler<'/test', unknown, {}, unknown, AppRequest> = (req) => {
 *   req.logger.log('Hello');  // AppRequest properties available
 *   return { ok: true };
 * };
 */
export type DiraHandler<
  TRoute extends string = string,
  TBody = unknown,
  TQuery extends Record<string, string | string[]> = Record<
    string,
    string | string[]
  >,
  TReturn = unknown,
  TRequest extends DiraHttpRequest = DiraHttpRequest,
> = (
  req: TRequest & { params: ExtractParams<TRoute> },
) => HandlerReturn<TReturn>;
