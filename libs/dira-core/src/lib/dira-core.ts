import 'reflect-metadata';
import type { ControllerMetadata } from './controller-metadata';
import type { DiraAdapter } from './dira-adapter';
import type { DiraAdapterOptions } from './dira-adapter-options';
import { CONTROLLER_PREFIX } from './dira-controller';
import { HTTP_ROUTES } from './dira-http';
import { discoverControllers } from './discover-controllers';
import type { DiscoverOptions } from './discover-options';
import type { HttpHandler } from './http-handler';
import type { RouteRegistration } from './route-registration';

/** Core framework class for registering HTTP handlers and running the server. */
export class DiraCore {
  private routes: RouteRegistration[] = [];

  /**
   * Registers a single HTTP handler for a route.
   * @param route - Route path to handle.
   * @param handler - Async function that processes requests and returns responses.
   */
  registerHttpHandler(route: string, handler: HttpHandler): this {
    this.routes.push({ route, handler });
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
      const handler = (controller as Record<string, HttpHandler>)[method].bind(
        controller,
      );
      this.registerHttpHandler(fullRoute, handler);
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
