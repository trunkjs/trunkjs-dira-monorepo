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
import type { HttpMethod } from './http-method';
import type { DiraHandler, HttpHandler } from './http-handler';
import { DiraHttpRequest } from './request/dira-http-request';
import type { DiraHttpRequestClass } from './request/dira-http-request-class';
import { HttpRequestDataProvider } from './request/http-request-data-provider';
import type { RouteRegistration } from './route-registration';
import { validateRoute } from './validate-route';
import { wrapResponse } from './wrap-response';

/** Core framework class for registering HTTP handlers and running the server. */
export class DiraCore {
  private routes: RouteRegistration[] = [];
  private registeredNames = new Set<string>();
  private RequestClass: DiraHttpRequestClass = DiraHttpRequest;

  /**
   * Sets a custom request class to use for all handlers.
   * The class must extend DiraHttpRequest and accept a RequestDataProvider in its constructor.
   * @param cls - Custom request class extending DiraHttpRequest
   * @returns this for chaining
   */
  setRequestClass<T extends DiraHttpRequest<unknown, unknown, unknown>>(
    cls: new (factory: InstanceType<typeof HttpRequestDataProvider>) => T,
  ): this {
    this.RequestClass = cls as unknown as DiraHttpRequestClass;
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
   * Extracts path params, creates request factory, instantiates request class, and wraps the response.
   */
  private wrapHandler(route: string, handler: Function): HttpHandler {
    return async (rawReq: Request): Promise<Response> => {
      const pathParams = extractPathParams(route, rawReq.url);
      const factory = new HttpRequestDataProvider(rawReq, pathParams);
      const request = new this.RequestClass(factory);
      const result = handler(request);
      return wrapResponse(result);
    };
  }

  /**
   * Registers a type-safe handler with auto-inferred path parameters.
   * @param route - Route pattern with parameters (e.g., "/users/:id" or "/files/::path")
   * @param handler - Handler function receiving DiraRequest with typed params
   * @param options - Optional configuration including HTTP methods and name
   */
  registerHandler<TRoute extends string>(
    route: TRoute,
    handler: DiraHandler<TRoute>,
    options?: { method?: HttpMethod | HttpMethod[]; name?: string },
  ): this {
    validateRoute(route);

    if (options?.name) {
      this.validateUniqueName(options.name);
    }

    const wrappedHandler = this.wrapHandler(route, handler);
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
   * @param controller - Instance of a class decorated with @DiraController.
   */
  registerController(controller: object): this {
    const prefix = getControllerPrefix(controller.constructor);
    const controllerName = getControllerName(controller.constructor);
    const routes: ControllerMetadata[] = getHttpRoutes(controller);

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

      const wrappedHandler = this.wrapHandler(fullRoute, originalHandler);
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
