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
 * @template TRoute - Route pattern string (e.g., "/users/:id")
 * @template TBody - Expected request body type
 * @template TQuery - Expected query parameters shape
 * @template TReturn - Expected return value type
 */
export type DiraHandler<
  TRoute extends string = string,
  TBody = unknown,
  TQuery extends Record<string, string | string[]> = Record<
    string,
    string | string[]
  >,
  TReturn = unknown,
> = (
  req: DiraHttpRequest<TBody, TQuery, ExtractParams<TRoute>>,
) => HandlerReturn<TReturn>;
