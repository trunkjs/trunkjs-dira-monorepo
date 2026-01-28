import 'reflect-metadata';
import type { ControllerMetadata } from './controller-metadata';

/** Symbol key for storing HTTP route metadata on controllers. */
export const HTTP_ROUTES = Symbol('dira:http:routes');

/** Options for the @DiraHttp decorator. */
export interface DiraHttpOptions {
  /** HTTP method (GET, POST, etc.). Reserved for future use. */
  method?: string;
}

/**
 * Method decorator that registers a method as an HTTP handler.
 * @param route - Route path for this handler, appended to controller prefix.
 * @param options - Optional configuration for the handler.
 * @template TRoute - Route pattern string for type inference (e.g., "/users/:id")
 */
export function DiraHttp<TRoute extends string>(
  route: TRoute,
  options?: DiraHttpOptions,
): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    _descriptor: PropertyDescriptor,
  ) {
    const routes: ControllerMetadata[] =
      Reflect.getMetadata(HTTP_ROUTES, target.constructor) || [];
    routes.push({
      route,
      method: String(propertyKey),
      httpMethod: options?.method,
    });
    Reflect.defineMetadata(HTTP_ROUTES, routes, target.constructor);
  };
}
