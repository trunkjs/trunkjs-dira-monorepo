import type { DiraAdapterOptions } from './dira-adapter-options';
import type { RouteRegistration } from './route-registration';
import type { ServerInfo } from './server-info';

export interface DiraAdapter {
  start(
    routes: RouteRegistration[],
    options?: DiraAdapterOptions,
  ): ServerInfo | Promise<ServerInfo>;
  stop?(): void | Promise<void>;
}
