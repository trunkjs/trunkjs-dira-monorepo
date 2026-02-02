import { DiraError, isStage3Decorator } from '@dira/common';

/**
 * Decorator that caches the result of a getter.
 *
 * The value is computed once on first access and cached for all subsequent
 * accesses on the same instance.
 *
 * @throws {DiraError} If applied to a method instead of a getter
 *
 * @example
 * ```typescript
 * class UserService {
 *   @Cached()
 *   get config() {
 *     return { apiUrl: 'https://api.example.com' };
 *   }
 * }
 * ```
 */
export function Cached(): {
  // Stage 3 getter decorator
  <This, Return>(
    getter: (this: This) => Return,
    context: ClassGetterDecoratorContext<This, Return>,
  ): (this: This) => Return;
  // Legacy decorator
  (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor | void;
} {
  // Per-instance cache storage
  const instanceCaches = new WeakMap<object, Map<string, unknown>>();

  // Creates a cached wrapper for a getter
  const createGetterWrapper = <This, Return>(
    originalGetter: (this: This) => Return,
    getterName: string,
  ): ((this: This) => Return) => {
    return function (this: This): Return {
      let cache = instanceCaches.get(this as object);
      if (!cache) {
        cache = new Map();
        instanceCaches.set(this as object, cache);
      }

      const key = getterName;
      if (cache.has(key)) {
        return cache.get(key) as Return;
      }

      const result = originalGetter.call(this);
      cache.set(key, result);
      return result;
    };
  };

  // Implementation signature is looser than overloads
  return function (
    methodOrTarget: Function | object,
    contextOrPropertyKey?:
      | ClassMethodDecoratorContext
      | ClassGetterDecoratorContext
      | string
      | symbol,
    descriptor?: PropertyDescriptor,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    if (isStage3Decorator(contextOrPropertyKey)) {
      // Stage 3: (method/getter, context) => method/getter
      const fn = methodOrTarget as Function;
      const name = String(contextOrPropertyKey.name);

      if (contextOrPropertyKey.kind === 'getter') {
        return createGetterWrapper(fn as () => unknown, name);
      }

      // Method decorator not supported
      throw new DiraError(
        `@Cached() can only be applied to getters, not methods. ` +
          `Found on method "${name}".`,
      );
    }

    // Legacy: (target, propertyKey, descriptor) => descriptor
    const name = String(contextOrPropertyKey);

    if (descriptor) {
      // Getter
      if (typeof descriptor.get === 'function') {
        descriptor.get = createGetterWrapper(descriptor.get, name);
        return descriptor;
      }

      // Method - throw error
      if (typeof descriptor.value === 'function') {
        throw new DiraError(
          `@Cached() can only be applied to getters, not methods. ` +
            `Found on method "${name}".`,
        );
      }
    }

    return descriptor;
  };
}
