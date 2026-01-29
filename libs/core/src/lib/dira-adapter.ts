import type { DiraAdapterOptions } from './dira-adapter-options';
import type { MiddlewareBridge } from './middleware/adapter-middleware';
import type { RouteRegistration } from './route-registration';
import type { ServerInfo } from './server-info';

export interface DiraAdapter {
  start(
    routes: RouteRegistration[],
    options?: DiraAdapterOptions,
  ): ServerInfo | Promise<ServerInfo>;
  stop?(): void | Promise<void>;

  /**
   * Optional bridge for converting adapter-native middleware to Dira middleware.
   * When present, allows using the adapter's ecosystem middleware with Dira.
   *
   * @example
   * import { cors } from 'hono/cors';
   *
   * const adapter = new HonoAdapter();
   * const dira = new DiraCore()
   *   .use(adapter.middlewareBridge!.bridge(cors()));
   */
  middlewareBridge?: MiddlewareBridge;
}
