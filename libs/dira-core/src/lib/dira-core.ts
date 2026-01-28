import 'reflect-metadata';
import type { ControllerMetadata } from './controller-metadata';
import { createDiraRequest } from './create-dira-request';
import type { DiraAdapter } from './dira-adapter';
import type { DiraAdapterOptions } from './dira-adapter-options';
import { CONTROLLER_PREFIX } from './dira-controller';
import { HTTP_ROUTES } from './dira-http';
import { discoverControllers } from './discover-controllers';
import type { DiscoverOptions } from './discover-options';
import { extractPathParams } from './extract-path-params';
import type { DiraHandler, HttpHandler } from './http-handler';
import type { RouteRegistration } from './route-registration';
import { wrapResponse } from './wrap-response';

/** Core framework class for registering HTTP handlers and running the server. */
export class DiraCore {
  private routes: RouteRegistration[] = [];

  /**
   * Wraps a handler function to convert DiraRequest-based handlers to HttpHandler.
   * Extracts path params, creates DiraRequest, and wraps the response.
   */
  private wrapHandler(route: string, handler: Function): HttpHandler {
    return async (rawReq: Request): Promise<Response> => {
      const params = extractPathParams(route, rawReq.url);
      const diraReq = createDiraRequest(rawReq, params);
      const result = handler(diraReq);
      return wrapResponse(result);
    };
  }

  /**
   * Registers a type-safe handler with auto-inferred path parameters.
   * @param route - Route pattern with parameters (e.g., "/users/:id")
   * @param handler - Handler function receiving DiraRequest with typed params
   */
  registerHandler<TRoute extends string>(
    route: TRoute,
    handler: DiraHandler<TRoute>,
  ): this {
    const wrappedHandler = this.wrapHandler(route, handler);
    this.routes.push({ route, handler: wrappedHandler });
    return this;
  }

  /**
   * Registers all handlers from a controller instance decorated with @DiraController.
   * @param controller - Instance of a class decorated with @DiraController.
   */
  registerController(controller: object): this {
    const prefix: string =
      Reflect.getMetadata(CONTROLLER_PREFIX, controller.constructor) || '';
    const routes: ControllerMetadata[] =
      Reflect.getMetadata(HTTP_ROUTES, controller.constructor) || [];

    for (const { route, method } of routes) {
      const fullRoute = prefix + route;
      const originalHandler = (controller as Record<string, Function>)[
        method
      ].bind(controller);
      const wrappedHandler = this.wrapHandler(fullRoute, originalHandler);
      this.routes.push({ route: fullRoute, handler: wrappedHandler });
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
