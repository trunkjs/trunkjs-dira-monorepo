import type { DiraHttpRequest } from '../request/dira-http-request';
import { wrapResponse } from '../wrap-response';
import {
  attachContext,
  createContextStore,
  type ContextStore,
} from './middleware-context';
import type {
  DiraMiddleware,
  DiraMiddlewareFactory,
  MiddlewareDescriptor,
  MiddlewareNext,
} from './middleware-types';

/**
 * Checks if a middleware is a factory function (takes only request, returns middleware).
 * Factory functions have exactly 1 parameter (the request).
 */
function isMiddlewareFactory(
  fn: DiraMiddleware | DiraMiddlewareFactory,
): fn is DiraMiddlewareFactory {
  return fn.length === 1;
}

/**
 * Composes middleware into a single handler function using the onion model.
 *
 * The onion model means:
 * - Code before `await next()` runs on the way IN (request phase)
 * - Code after `await next()` runs on the way OUT (response phase)
 * - Middleware can short-circuit by returning early without calling next()
 *
 * Middleware execution order follows a clear convention:
 * 1. Global middleware (in order of `.use()` calls)
 * 2. Controller-level middleware (in order of `@UseMiddleware` decorators)
 * 3. Method-level middleware (in order of `@UseMiddleware` decorators)
 *
 * @param middlewareList - Array of middleware descriptors to compose (executed in array order)
 * @param handler - The final handler function to call after all middleware
 * @param contextStore - Optional pre-existing context store (for testing)
 * @returns A function that executes the full middleware chain
 *
 * @example
 * const chain = composeMiddleware(
 *   [{ middleware: loggingMiddleware }, { middleware: authMiddleware }],
 *   (req) => ({ data: 'response' })
 * );
 * const response = await chain(request);
 */
export function composeMiddleware(
  middlewareList: MiddlewareDescriptor[],
  handler: (request: DiraHttpRequest) => unknown,
  contextStore?: ContextStore,
): (request: DiraHttpRequest) => Promise<Response> {
  return async (request: DiraHttpRequest): Promise<Response> => {
    // Create or use provided context store
    const store = contextStore ?? createContextStore();

    // Attach context proxy to request
    const requestWithContext = attachContext(request, store);

    // Build the dispatch function for onion model execution
    const dispatch = async (index: number): Promise<Response> => {
      // If we've gone through all middleware, call the final handler
      if (index >= middlewareList.length) {
        const result = handler(requestWithContext);
        return wrapResponse(result);
      }

      const descriptor = middlewareList[index];
      let middleware: DiraMiddleware;

      // Resolve factory if needed
      if (isMiddlewareFactory(descriptor.middleware)) {
        middleware = descriptor.middleware(requestWithContext);
      } else {
        middleware = descriptor.middleware as DiraMiddleware;
      }

      // Create next function that continues to next middleware
      const next: MiddlewareNext = () => dispatch(index + 1);

      // Execute middleware
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return middleware(requestWithContext as any, next);
    };

    // Start the chain
    return dispatch(0);
  };
}

/**
 * Creates a no-op middleware chain that just calls the handler.
 * Useful when no middleware is configured.
 */
export function createPassthroughChain(
  handler: (request: DiraHttpRequest) => unknown,
): (request: DiraHttpRequest) => Promise<Response> {
  return async (request: DiraHttpRequest): Promise<Response> => {
    const store = createContextStore();
    const requestWithContext = attachContext(request, store);
    const result = handler(requestWithContext);
    return wrapResponse(result);
  };
}
