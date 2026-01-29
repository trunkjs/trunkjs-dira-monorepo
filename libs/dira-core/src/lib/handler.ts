import type { DiraRequest } from './dira-request';
import type { ExtractParams } from './types/extract-params';
import type { HandlerReturn } from './types/handler-return';

/** Symbol to identify handler wrappers */
export const HANDLER_WRAPPER = Symbol('dira:handler:wrapper');

/** Wrapper object returned by the handler() helper */
export interface HandlerWrapper<
  TRoute extends string = string,
  TBody = unknown,
  TQuery = Record<string, string | string[] | undefined>,
  TReturn = unknown,
> {
  [HANDLER_WRAPPER]: true;
  route: TRoute;
  handler: (
    req: DiraRequest<TBody, TQuery, ExtractParams<TRoute>>,
  ) => HandlerReturn<TReturn>;
}

/** Builder returned when handler() is called with type params but no arguments */
interface HandlerBuilder<
  TBody = unknown,
  TQuery = Record<string, string | string[] | undefined>,
> {
  <TRoute extends string, TReturn = unknown>(
    route: TRoute,
    fn: (
      req: DiraRequest<TBody, TQuery, ExtractParams<TRoute>>,
    ) => HandlerReturn<TReturn>,
  ): HandlerWrapper<TRoute, TBody, TQuery, TReturn>;
}

/**
 * Helper function that creates a typed handler with automatic path parameter inference.
 * Use with @DiraHttp() (no arguments) for full type inference.
 *
 * @example
 * ```typescript
 * // Simple usage - path params auto-inferred
 * @DiraHttp()
 * getUser = handler('/:id', (req) => {
 *   return { userId: req.params.id }; // typed as string
 * });
 *
 * // With typed body - use curried form
 * @DiraHttp()
 * updateUser = handler<UpdateUserBody>()('/:id', async (req) => {
 *   const body = await req.json(); // typed as UpdateUserBody
 *   return { id: req.params.id, ...body };
 * });
 *
 * // With typed body and query
 * @DiraHttp()
 * search = handler<never, SearchQuery>()('/search', (req) => {
 *   return { query: req.query.q }; // typed
 * });
 * ```
 */
export function handler<
  TBody = unknown,
  TQuery = Record<string, string | string[] | undefined>,
>(): HandlerBuilder<TBody, TQuery>;

export function handler<
  TRoute extends string,
  TBody = unknown,
  TQuery = Record<string, string | string[] | undefined>,
  TReturn = unknown,
>(
  route: TRoute,
  fn: (
    req: DiraRequest<TBody, TQuery, ExtractParams<TRoute>>,
  ) => HandlerReturn<TReturn>,
): HandlerWrapper<TRoute, TBody, TQuery, TReturn>;

export function handler<
  TRouteOrBody = unknown,
  TBodyOrQuery = Record<string, string | string[] | undefined>,
  TQuery = Record<string, string | string[] | undefined>,
  TReturn = unknown,
>(
  route?: TRouteOrBody,
  fn?: (
    req: DiraRequest<TBodyOrQuery, TQuery, ExtractParams<string>>,
  ) => HandlerReturn<TReturn>,
):
  | HandlerWrapper<string, TBodyOrQuery, TQuery, TReturn>
  | HandlerBuilder<TRouteOrBody, TBodyOrQuery> {
  // Curried form: handler<BodyType>()('route', fn)
  if (route === undefined) {
    return <TRoute extends string, TRet = unknown>(
      r: TRoute,
      f: (
        req: DiraRequest<TRouteOrBody, TBodyOrQuery, ExtractParams<TRoute>>,
      ) => HandlerReturn<TRet>,
    ): HandlerWrapper<TRoute, TRouteOrBody, TBodyOrQuery, TRet> => ({
      [HANDLER_WRAPPER]: true,
      route: r,
      handler: f,
    });
  }

  // Direct form: handler('route', fn)
  return {
    [HANDLER_WRAPPER]: true,
    route: route as unknown as string,
    handler: fn!,
  };
}

/** Type guard to check if a value is a handler wrapper */
export function isHandlerWrapper(value: unknown): value is HandlerWrapper {
  return (
    typeof value === 'object' &&
    value !== null &&
    HANDLER_WRAPPER in value &&
    (value as HandlerWrapper)[HANDLER_WRAPPER] === true
  );
}
