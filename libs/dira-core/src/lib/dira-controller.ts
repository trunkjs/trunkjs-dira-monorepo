import 'reflect-metadata';

/** Symbol key for storing controller route prefix metadata. */
export const CONTROLLER_PREFIX = Symbol('dira:controller:prefix');

/**
 * Class decorator that marks a class as a Dira controller.
 * @param prefix - Route prefix applied to all handler routes in this controller.
 */
export function DiraController(prefix: string = ''): ClassDecorator {
  return function (target: Function) {
    Reflect.defineMetadata(CONTROLLER_PREFIX, prefix, target);
  };
}
