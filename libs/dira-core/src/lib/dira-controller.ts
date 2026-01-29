import 'reflect-metadata';
import { validateRouteName } from './validate-route-name';

/** Symbol key for storing controller route prefix metadata. */
export const CONTROLLER_PREFIX = Symbol('dira:controller:prefix');

/** Symbol key for storing controller name metadata. */
export const CONTROLLER_NAME = Symbol('dira:controller:name');

/** Options for the @DiraController decorator. */
export interface DiraControllerOptions {
  /**
   * Route name used for SDK generation.
   * Must follow dot-naming convention: alphanumeric, dots, and hyphens only.
   * Examples: "api.users", "admin.dashboard"
   * Defaults to the class name if not specified.
   */
  name?: string;
}

/**
 * Class decorator that marks a class as a Dira controller.
 * @param prefix - Route prefix applied to all handler routes in this controller.
 * @param options - Optional configuration including name for SDK generation.
 */
export function DiraController(
  prefix: string = '',
  options?: DiraControllerOptions,
): ClassDecorator {
  return function (target: Function) {
    Reflect.defineMetadata(CONTROLLER_PREFIX, prefix, target);

    const name = options?.name ?? target.name;
    if (options?.name) {
      validateRouteName(options.name);
    }
    Reflect.defineMetadata(CONTROLLER_NAME, name, target);
  };
}
