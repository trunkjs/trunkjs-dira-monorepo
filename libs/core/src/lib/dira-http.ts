import type { ControllerMetadata } from './controller-metadata';
import type { HttpMethod } from './http-method';
import { validateRouteName } from './validate-route-name';

/** Symbol key for storing HTTP route metadata on methods. */
export const HTTP_ROUTES = Symbol('dira:http:routes');

/** Sentinel value indicating route should be extracted from handler() wrapper. */
export const ROUTE_FROM_WRAPPER = Symbol('dira:route:from-wrapper');

/** Options for the @DiraHttp decorator. */
export interface DiraHttpOptions {
  /** HTTP method(s) this handler responds to. Defaults to all methods if not specified. */
  method?: HttpMethod | HttpMethod[];
  /**
   * Route name used for SDK generation.
   * Must follow dot-naming convention: alphanumeric, dots, and hyphens only.
   * Examples: "get-user", "list-all"
   * Defaults to the method name if not specified.
   */
  name?: string;
}

/** Metadata attached to each decorated method/field. */
export interface HttpRouteMetadata {
  route: string | symbol;
  methodName: string;
  httpMethods?: HttpMethod[];
  name: string;
}

/** WeakMap storing route metadata lists keyed by class constructor. */
const classRoutesMap = new WeakMap<Function, HttpRouteMetadata[]>();

/** WeakMap storing field route metadata keyed by (constructor, propertyName). */
const fieldRoutesMap = new WeakMap<
  Function,
  Map<string | symbol, HttpRouteMetadata>
>();

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
): {
  // Stage 3 method decorator
  <This, Args extends unknown[], Return>(
    method: (this: This, ...args: Args) => Return,
    context: ClassMethodDecoratorContext<
      This,
      (this: This, ...args: Args) => Return
    >,
  ): (this: This, ...args: Args) => Return;
  // Stage 3 field decorator
  <This, Value>(
    value: undefined,
    context: ClassFieldDecoratorContext<This, Value>,
  ): (this: This, initialValue: Value) => Value;
  // Legacy method decorator
  (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): void;
  // Legacy property decorator
  (target: object, propertyKey: string | symbol): void;
} {
  // Handle @DiraHttp({ method: 'GET' }) - options only
  let route: TRoute | symbol | undefined;
  let resolvedOptions: DiraHttpOptions | undefined;

  if (typeof routeOrOptions === 'object' && routeOrOptions !== null) {
    // First arg is options object
    resolvedOptions = routeOrOptions;
    route = undefined;
  } else {
    route = routeOrOptions;
    resolvedOptions = options;
  }

  // Return decorator function that works with both method and field decorators
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (
    methodOrTarget: Function | object | undefined,
    contextOrPropertyKey?:
      | ClassMethodDecoratorContext
      | ClassFieldDecoratorContext
      | string
      | symbol,
    descriptor?: PropertyDescriptor,
  ): any {
    // Determine decorator type based on arguments
    const isStage3Context =
      contextOrPropertyKey !== null &&
      typeof contextOrPropertyKey === 'object' &&
      'kind' in contextOrPropertyKey;

    let methodName: string;

    if (isStage3Context) {
      const context = contextOrPropertyKey as
        | ClassMethodDecoratorContext
        | ClassFieldDecoratorContext;
      methodName = String(context.name);

      // Normalize method option to array
      const httpMethods = resolvedOptions?.method
        ? Array.isArray(resolvedOptions.method)
          ? resolvedOptions.method
          : [resolvedOptions.method]
        : undefined;

      // Use provided name or fall back to method name
      const name = resolvedOptions?.name ?? methodName;
      if (resolvedOptions?.name) {
        validateRouteName(resolvedOptions.name);
      }

      // Build metadata for this handler
      const metadata: HttpRouteMetadata = {
        route: route ?? ROUTE_FROM_WRAPPER,
        methodName,
        httpMethods,
        name,
      };

      if (context.kind === 'method') {
        // Method decorator - attach metadata to the method
        const method = methodOrTarget as Function;
        try {
          Object.defineProperty(method, HTTP_ROUTES, {
            value: metadata,
            enumerable: false,
            configurable: true,
            writable: true,
          });
        } catch {
          // Method might be frozen
        }
        return method;
      } else if (context.kind === 'field') {
        // Field decorator - store metadata by property name for later lookup
        // Return an initializer that registers the field
        return (function (this: object, initialValue: unknown) {
          const ctor = this.constructor;
          let fieldMap = fieldRoutesMap.get(ctor);
          if (!fieldMap) {
            fieldMap = new Map();
            fieldRoutesMap.set(ctor, fieldMap);
          }
          fieldMap.set(context.name, metadata);
          return initialValue;
        } as unknown) as undefined;
      }
    } else {
      // Legacy decorator: (target, propertyKey, descriptor?) => void
      const target = methodOrTarget as object;
      methodName = String(contextOrPropertyKey);
      const ctor = target.constructor;

      // Normalize method option to array
      const httpMethods = resolvedOptions?.method
        ? Array.isArray(resolvedOptions.method)
          ? resolvedOptions.method
          : [resolvedOptions.method]
        : undefined;

      // Use provided name or fall back to method name
      const name = resolvedOptions?.name ?? methodName;
      if (resolvedOptions?.name) {
        validateRouteName(resolvedOptions.name);
      }

      // Build metadata
      const metadata: HttpRouteMetadata = {
        route: route ?? ROUTE_FROM_WRAPPER,
        methodName,
        httpMethods,
        name,
      };

      if (descriptor && typeof descriptor.value === 'function') {
        // Method decorator - attach metadata to the method
        try {
          Object.defineProperty(descriptor.value, HTTP_ROUTES, {
            value: metadata,
            enumerable: false,
            configurable: true,
            writable: true,
          });
        } catch {
          // Method might be frozen
        }
      } else {
        // Property decorator (for handler() wrapper) - store by property name
        let fieldMap = fieldRoutesMap.get(ctor);
        if (!fieldMap) {
          fieldMap = new Map();
          fieldRoutesMap.set(ctor, fieldMap);
        }
        fieldMap.set(contextOrPropertyKey as string | symbol, metadata);
      }
    }
  };
}

/**
 * Collects route metadata from a class constructor.
 * Looks for decorated methods on the prototype and decorated fields.
 * @internal
 */
function collectHttpRoutes(ctor: Function): HttpRouteMetadata[] {
  const routes: HttpRouteMetadata[] = [];
  const proto = ctor.prototype;

  // Collect from decorated methods (metadata attached to method functions)
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key === 'constructor') continue;

    const prop = proto[key];
    if (typeof prop !== 'function') continue;

    const metadata = (prop as Record<symbol, HttpRouteMetadata>)[HTTP_ROUTES];
    if (metadata) {
      routes.push(metadata);
    }
  }

  // Collect from field decorators (stored in fieldRoutesMap)
  const fieldMap = fieldRoutesMap.get(ctor);
  if (fieldMap) {
    for (const metadata of fieldMap.values()) {
      routes.push(metadata);
    }
  }

  return routes;
}

/**
 * Gets all HTTP route metadata from a controller instance.
 * @param controller - The controller instance.
 * @returns Array of controller metadata for all decorated methods/fields.
 */
export function getHttpRoutes(controller: object): ControllerMetadata[] {
  const ctor = controller.constructor;

  // Collect routes if not already cached
  if (!classRoutesMap.has(ctor)) {
    classRoutesMap.set(ctor, collectHttpRoutes(ctor));
  }

  const metadataList = classRoutesMap.get(ctor) ?? [];

  return metadataList.map((metadata) => ({
    route:
      typeof metadata.route === 'symbol'
        ? (metadata.route as unknown as string)
        : metadata.route,
    method: metadata.methodName,
    httpMethods: metadata.httpMethods,
    name: metadata.name,
  }));
}
