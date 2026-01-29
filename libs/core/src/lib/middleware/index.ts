// Type definitions
export type {
  DiraMiddleware,
  DiraMiddlewareFactory,
  MiddlewareDescriptor,
  MiddlewareNext,
} from './middleware-types';

// Context store
export {
  attachContext,
  ContextStore,
  createContextStore,
  MIDDLEWARE_CONTEXT,
} from './middleware-context';

// Middleware storage
export {
  getControllerMiddleware,
  getRouteMiddleware,
  setControllerMiddleware,
  setRouteMiddleware,
} from './middleware-storage';

// Decorator
export { UseMiddleware, type UseMiddlewareOptions } from './use-middleware';

// Executor
export {
  composeMiddleware,
  createPassthroughChain,
} from './middleware-executor';

// Error handling
export { HttpError } from './http-error';
export {
  errorHandlerMiddleware,
  type ErrorHandlerOptions,
} from './error-middleware';

// Adapter bridge
export type { MiddlewareBridge } from './adapter-middleware';
