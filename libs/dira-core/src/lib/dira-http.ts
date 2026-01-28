import 'reflect-metadata';
import type { ControllerMetadata } from './controller-metadata';

/** Symbol key for storing HTTP route metadata on controllers. */
export const HTTP_ROUTES = Symbol('dira:http:routes');

/** Sentinel value indicating route should be read from handler wrapper. */
export const ROUTE_FROM_HANDLER = Symbol('dira:route:from-handler');

/** Options for the @DiraHttp decorator. */
export interface DiraHttpOptions {
  /** HTTP method (GET, POST, etc.). Reserved for future use. */
  method?: string;
}

/**
 * Decorator that registers a method or property as an HTTP handler.
 *
 * Can be used in two ways:
 * 1. With explicit route: `@DiraHttp('/users/:id')`
 * 2. With handler() wrapper: `@DiraHttp()` + `handler('/:id', fn)`
 *
 * @param route - Route path for this handler, appended to controller prefix.
 *                Omit when using with handler() wrapper.
 * @param options - Optional configuration for the handler.
 * @template TRoute - Route pattern string for type inference (e.g., "/users/:id")
 */
export function DiraHttp<TRoute extends string>(
  route?: TRoute,
  options?: DiraHttpOptions,
): MethodDecorator & PropertyDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    _descriptor?: PropertyDescriptor,
  ) {
    const routes: ControllerMetadata[] =
      Reflect.getMetadata(HTTP_ROUTES, target.constructor) || [];
    routes.push({
      route: route ?? (ROUTE_FROM_HANDLER as unknown as string),
      method: String(propertyKey),
      httpMethod: options?.method,
    });
    Reflect.defineMetadata(HTTP_ROUTES, routes, target.constructor);
  };
}
