import { validateRouteName } from './validate-route-name';

/** Symbol key for storing controller route prefix metadata. */
export const CONTROLLER_PREFIX = Symbol('dira:controller:prefix');

/** Symbol key for storing controller name metadata. */
export const CONTROLLER_NAME = Symbol('dira:controller:name');

/** WeakMap storing controller metadata keyed by class constructor. */
const controllerMetadataMap = new WeakMap<
  Function,
  { prefix: string; name: string }
>();

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
 * Works with both stage 3 and legacy TypeScript decorators.
 * @param prefix - Route prefix applied to all handler routes in this controller.
 * @param options - Optional configuration including name for SDK generation.
 */
export function DiraController(
  prefix: string = '',
  options?: DiraControllerOptions,
) {
  return function <T extends new (...args: unknown[]) => object>(
    target: T,
    _context?: ClassDecoratorContext<T>,
  ): T {
    const name = options?.name ?? target.name;
    if (options?.name) {
      validateRouteName(options.name);
    }
    controllerMetadataMap.set(target, { prefix, name });
    return target;
  };
}

/**
 * Checks if a class is decorated with @DiraController.
 * @param target - The class constructor to check.
 * @returns true if the class is a controller.
 */
export function isController(target: Function): boolean {
  return controllerMetadataMap.has(target);
}

/**
 * Gets the route prefix for a controller class.
 * @param target - The controller class constructor.
 * @returns The prefix string or empty string if not found.
 */
export function getControllerPrefix(target: Function): string {
  return controllerMetadataMap.get(target)?.prefix ?? '';
}

/**
 * Gets the name for a controller class.
 * @param target - The controller class constructor.
 * @returns The name string or the constructor name if not found.
 */
export function getControllerName(target: Function): string {
  return controllerMetadataMap.get(target)?.name ?? target.name;
}
