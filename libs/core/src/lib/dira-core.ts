import { DiraError } from '@dira/common';
import type { ControllerMetadata } from './controller-metadata';
import { convertRouteForAdapter } from './convert-route-for-adapter';
import type { DiraAdapter } from './dira-adapter';
import type { DiraAdapterOptions } from './dira-adapter-options';
import { getControllerName, getControllerPrefix } from './dira-controller';
import { getHttpRoutes, ROUTE_FROM_WRAPPER } from './dira-http';
import { discoverControllers } from './discover-controllers';
import type { DiscoverOptions } from './discover-options';
import { extractPathParams } from './extract-path-params';
import { isHandlerWrapper } from './handler';
import type { DiraHandler, HttpHandler } from './http-handler';
import {
  attachContext,
  composeMiddleware,
  createContextStore,
  getControllerMiddleware,
  getRouteMiddleware,
} from './middleware';
import type { DiraMiddleware, MiddlewareDescriptor } from './middleware';
import type { RegisterHandlerOptions } from './register-handler-options';
import { DiraHttpRequest } from './request/dira-http-request';
import type { DiraHttpRequestClass } from './request/dira-http-request-class';
import { HttpRequestDataProvider } from './request/http-request-data-provider';
import type { RouteRegistration } from './route-registration';
import type { UseMiddlewareOptions } from './use-middleware-options';
import { validateRoute } from './validate-route';
import { wrapResponse } from './wrap-response';

/**
 * Core framework class for registering HTTP handlers and running the server.
 *
 * @template TRequest - The request class type used for handlers and middleware.
 *                      Defaults to DiraHttpRequest. Use setRequestClass() to narrow
 *                      the type to your custom request class.
 *
 * @example
 * // Basic usage with default request type
 * const dira = new DiraCore()
 *   .use(timingMiddleware)
 *   .registerHandler('/health', () => ({ status: 'ok' }));
 *
 * @example
 * // With custom request class for type-safe DI
 * const dira = new DiraCore()
 *   .setRequestClass(AppRequest)  // Returns DiraCore<AppRequest>
 *   .use(loggingMiddleware)       // Middleware receives AppRequest
 *   .registerHandler('/test', (req) => {
 *     req.logger.log('Hello');    // Properly typed!
 *     return { ok: true };
 *   });
 */
export class DiraCore<
  TRequest extends DiraHttpRequest = DiraHttpRequest,
> {
  private routes: RouteRegistration[] = [];
  private registeredNames = new Set<string>();
  private RequestClass: DiraHttpRequestClass = DiraHttpRequest;
  private globalMiddleware: MiddlewareDescriptor[] = [];

  /**
   * Sets a custom request class to use for all handlers.
   * Returns a new type with the request class type parameter updated.
   *
   * @param cls - Custom request class extending DiraHttpRequest
   * @returns this with updated type parameter for chaining
   *
   * @example
   * class AppRequest extends DiraHttpRequest {
   *   @Cached() get logger() { return this.newInstanceOf(LoggerService); }
   * }
   *
   * const dira = new DiraCore()
   *   .setRequestClass(AppRequest)  // Now DiraCore<AppRequest>
   *   .registerHandler('/test', (req) => {
   *     req.logger.log('Works!');   // Properly typed
   *   });
   */
  setRequestClass<T extends DiraHttpRequest>(
    cls: new (factory: HttpRequestDataProvider) => T,
  ): DiraCore<T> {
    this.RequestClass = cls as unknown as DiraHttpRequestClass;
    return this as unknown as DiraCore<T>;
  }

  /**
   * Registers global middleware that runs on all routes.
   *
   * Middleware execution order follows a clear convention:
   * 1. Global middleware (in order of `.use()` calls)
   * 2. Controller-level middleware (in order of `@UseMiddleware` decorators)
   * 3. Method-level middleware (in order of `@UseMiddleware` decorators)
   *
   * @example
   * const dira = new DiraCore()
   *   .setRequestClass(AppRequest)
   *   .use(errorHandlerMiddleware())
   *   .use(timingMiddleware)
   *   .use(authMiddleware);
   *
   * @param middleware - Middleware function(s) to register
   * @param options - Optional configuration for naming
   * @returns this for chaining
   */
  use(
    middleware:
      | DiraMiddleware<Record<string, unknown>, Record<string, unknown>, TRequest>
      | DiraMiddleware<
          Record<string, unknown>,
          Record<string, unknown>,
          TRequest
        >[],
    options?: UseMiddlewareOptions,
  ): this {
    const middlewareArray = Array.isArray(middleware)
      ? middleware
      : [middleware];
    const descriptors: MiddlewareDescriptor[] = middlewareArray.map(
      (mw) => ({
        middleware: mw,
        name: options?.name,
      }),
    );
    this.globalMiddleware.push(...descriptors);
    return this;
  }

  /**
   * Validates that a route name is unique across all registered routes.
   * @throws DiraError if the name is already registered.
   */
  private validateUniqueName(name: string): void {
    if (this.registeredNames.has(name)) {
      throw new DiraError(
        `Duplicate route name "${name}". Route names must be unique across all handlers.`,
      );
    }
    this.registeredNames.add(name);
  }

  /**
   * Wraps a handler function to convert DiraHttpRequest-based handlers to HttpHandler.
   * Extracts path params, creates request factory, instantiates request class,
   * composes middleware chain, and wraps the response.
   *
   * @param route - The route pattern for path parameter extraction
   * @param handler - The handler function to wrap
   * @param middleware - Middleware descriptors to apply (combined global + controller + route)
   */
  private wrapHandler(
    route: string,
    handler: Function,
    middleware: MiddlewareDescriptor[] = [],
  ): HttpHandler {
    // Combine global middleware with provided middleware
    const allMiddleware = [...this.globalMiddleware, ...middleware];

    return async (rawReq: Request): Promise<Response> => {
      const pathParams = extractPathParams(route, rawReq.url);
      const factory = new HttpRequestDataProvider(rawReq, pathParams);
      const request = new this.RequestClass(factory);

      // Cast request to TRequest - safe because RequestClass is set via setRequestClass<T>
      const typedRequest = request as TRequest;

      // If there's middleware, compose the chain
      if (allMiddleware.length > 0) {
        const chain = composeMiddleware(
          allMiddleware,
          handler as (request: TRequest) => unknown,
        );
        return chain(typedRequest);
      }

      // No middleware - direct execution with context attached
      const store = createContextStore();
      const requestWithContext = attachContext(typedRequest, store);
      const result = handler(requestWithContext);
      return wrapResponse(result);
    };
  }

  /**
   * Registers a type-safe handler with auto-inferred path parameters.
   *
   * The handler receives the configured request class (TRequest) with
   * typed path parameters extracted from the route pattern.
   *
   * @param route - Route pattern with parameters (e.g., "/users/:id" or "/files/::path")
   * @param handler - Handler function receiving the request with typed params
   * @param options - Optional configuration including HTTP methods, name, and middleware
   *
   * @example
   * dira.registerHandler('/users/:id', (req) => {
   *   const userId = req.params.id;  // Typed as string
   *   req.logger.log(`Fetching ${userId}`);  // Works if using AppRequest
   *   return { userId };
   * });
   */
  registerHandler<TRoute extends string>(
    route: TRoute,
    handler: DiraHandler<TRoute, unknown, Record<string, string | string[]>, unknown, TRequest>,
    options?: RegisterHandlerOptions<TRequest>,
  ): this {
    validateRoute(route);

    if (options?.name) {
      this.validateUniqueName(options.name);
    }

    // Convert inline middleware to descriptors
    const routeMiddleware: MiddlewareDescriptor[] = options?.middleware
      ? (Array.isArray(options.middleware)
          ? options.middleware
          : [options.middleware]
        ).map((mw) => ({ middleware: mw }))
      : [];

    const wrappedHandler = this.wrapHandler(route, handler, routeMiddleware);
    const adapterRoute = convertRouteForAdapter(route);
    const methods = options?.method
      ? Array.isArray(options.method)
        ? options.method
        : [options.method]
      : undefined;
    this.routes.push({
      route: adapterRoute,
      handler: wrappedHandler,
      methods,
      name: options?.name,
    });
    return this;
  }

  /**
   * Registers all handlers from a controller instance decorated with @DiraController.
   * Collects and applies controller-level and route-level middleware from @UseMiddleware decorators.
   * @param controller - Instance of a class decorated with @DiraController.
   */
  registerController(controller: object): this {
    const prefix = getControllerPrefix(controller.constructor);
    const controllerName = getControllerName(controller.constructor);
    const routes: ControllerMetadata[] = getHttpRoutes(controller);

    // Get controller-level middleware from @UseMiddleware decorator
    const controllerMiddleware = getControllerMiddleware(
      controller.constructor,
    );

    for (const { route: metadataRoute, method, httpMethods, name } of routes) {
      const property = (controller as Record<string, unknown>)[method];

      let route: string;
      let originalHandler: Function;

      // Check if this is a handler() wrapper
      if (isHandlerWrapper(property)) {
        route = property.route;
        originalHandler = property.handler;
      } else if (metadataRoute === (ROUTE_FROM_WRAPPER as unknown)) {
        throw new DiraError(
          `@DiraHttp() on "${method}" requires handler() wrapper. ` +
            `Use @DiraHttp('/route') or wrap with handler('/route', fn).`,
        );
      } else {
        route = metadataRoute;
        originalHandler = (property as Function).bind(controller);
      }

      const fullRoute = prefix + route;
      validateRoute(fullRoute);

      // Build full route name: controllerName.methodName
      const fullName = `${controllerName}.${name}`;
      this.validateUniqueName(fullName);

      // Get route-level middleware from @UseMiddleware decorator
      const routeMiddleware = getRouteMiddleware(
        controller.constructor,
        method,
      );

      // Combine: controller middleware runs before route middleware
      const combinedMiddleware = [...controllerMiddleware, ...routeMiddleware];

      const wrappedHandler = this.wrapHandler(
        fullRoute,
        originalHandler,
        combinedMiddleware,
      );
      const adapterRoute = convertRouteForAdapter(fullRoute);

      this.routes.push({
        route: adapterRoute,
        handler: wrappedHandler,
        methods: httpMethods,
        name: fullName,
      });
    }
    return this;
  }

  /**
   * Discovers and registers all controllers from TypeScript files in a directory.
   * @param directory - Path to directory containing controller files.
   * @param options - Optional configuration for file filtering.
   */
  async discover(directory: string, options?: DiscoverOptions): Promise<this> {
    const controllers = await discoverControllers(directory, options);
    for (const controller of controllers) {
      this.registerController(controller);
    }
    return this;
  }

  /**
   * Starts the server using the provided adapter.
   * @param adapter - Platform adapter (e.g., HonoAdapter) that handles HTTP serving.
   * @param options - Optional configuration like port number.
   */
  async run(adapter: DiraAdapter, options?: DiraAdapterOptions): Promise<void> {
    await adapter.start(this.routes, options);
  }
}
