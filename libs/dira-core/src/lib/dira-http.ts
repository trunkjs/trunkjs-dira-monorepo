import 'reflect-metadata';
import type { ControllerMetadata } from './controller-metadata';
import type { HttpMethod } from './http-method';

/** Symbol key for storing HTTP route metadata on controllers. */
export const HTTP_ROUTES = Symbol('dira:http:routes');

/** Sentinel value indicating route should be read from handler wrapper. */
export const ROUTE_FROM_HANDLER = Symbol('dira:route:from-handler');

/** Options for the @DiraHttp decorator. */
export interface DiraHttpOptions {
  /** HTTP method(s) this handler responds to. Defaults to all methods if not specified. */
  method?: HttpMethod | HttpMethod[];
}

/**
 * Decorator that registers a method or property as an HTTP handler.
 *
 * Can be used in several ways:
 * 1. With explicit route: `@DiraHttp('/users/:id')`
 * 2. With route and options: `@DiraHttp('/users', { method: 'GET' })`
 * 3. With handler() wrapper: `@DiraHttp()` + `handler('/:id', fn)`
 * 4. With options only (for handler()): `@DiraHttp({ method: 'DELETE' })`
 *
 * @param routeOrOptions - Route path or options object when using with handler()
 * @param options - Optional configuration for the handler
 * @template TRoute - Route pattern string for type inference (e.g., "/users/:id")
 */
export function DiraHttp<TRoute extends string>(
  routeOrOptions?: TRoute | DiraHttpOptions,
  options?: DiraHttpOptions,
): MethodDecorator & PropertyDecorator {
  // Handle @DiraHttp({ method: 'GET' }) - options only
  let route: TRoute | undefined;
  let resolvedOptions: DiraHttpOptions | undefined;

  if (typeof routeOrOptions === 'object' && routeOrOptions !== null) {
    // First arg is options object
    resolvedOptions = routeOrOptions;
    route = undefined;
  } else {
    route = routeOrOptions;
    resolvedOptions = options;
  }

  return function (
    target: object,
    propertyKey: string | symbol,
    _descriptor?: PropertyDescriptor,
  ) {
    const routes: ControllerMetadata[] =
      Reflect.getMetadata(HTTP_ROUTES, target.constructor) || [];

    // Normalize method option to array
    const httpMethods = resolvedOptions?.method
      ? Array.isArray(resolvedOptions.method)
        ? resolvedOptions.method
        : [resolvedOptions.method]
      : undefined;

    routes.push({
      route: route ?? (ROUTE_FROM_HANDLER as unknown as string),
      method: String(propertyKey),
      httpMethods,
    });
    Reflect.defineMetadata(HTTP_ROUTES, routes, target.constructor);
  };
}
