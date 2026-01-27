import type { DiraAdapterOptions } from './dira-adapter-options';
import type { RouteRegistration } from './route-registration';

export interface DiraAdapter {
  start(
    routes: RouteRegistration[],
    options?: DiraAdapterOptions,
  ): void | Promise<void>;
  stop?(): void | Promise<void>;
}
