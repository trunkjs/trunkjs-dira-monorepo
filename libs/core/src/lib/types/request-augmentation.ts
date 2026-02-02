import type { DiraHttpRequest } from '../request/dira-http-request';

/**
 * Replaces the `params` property of a request with a new type.
 * Use this instead of intersection types to avoid type conflicts when
 * the base request already has a `params` property.
 *
 * @template TRequest - The request class type
 * @template TParams - The new params type (typically from ExtractParams<TRoute>)
 *
 * @example
 * // In DiraHandler, this ensures route params override any existing params type
 * type Handler = (req: WithParams<AppRequest, { id: string }>) => unknown;
 */
export type WithParams<
  TRequest extends DiraHttpRequest,
  TParams,
> = Omit<TRequest, 'params'> & { params: TParams };

/**
 * Replaces or adds the `ctx` property on a request with a new context type.
 * Use this instead of intersection types to avoid type conflicts when
 * the base request might already have a `ctx` property.
 *
 * @template TRequest - The request class type
 * @template TContext - The context type to use
 *
 * @example
 * // In DiraMiddleware, this ensures context type is properly set
 * type Middleware = (req: WithContext<AppRequest, { user: User }>) => Response;
 */
export type WithContext<
  TRequest extends DiraHttpRequest,
  TContext,
> = Omit<TRequest, 'ctx'> & { ctx: TContext };
