import type { DiraRequest } from './dira-request';
import type { ExtractParams } from './types/extract-params';
import type { HandlerReturn } from './types/handler-return';

/** Internal handler type used by RouteRegistration. */
export type HttpHandler = (req: Request) => Promise<Response>;

/**
 * Type-safe handler using DiraRequest with auto-inferred path parameters.
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
  req: DiraRequest<TBody, TQuery, ExtractParams<TRoute>>,
) => HandlerReturn<TReturn>;
