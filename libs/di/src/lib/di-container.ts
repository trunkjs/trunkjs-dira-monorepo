import { DiraError } from '@dira/common';
import { getInjectMetadata } from './inject';
import { getInjectableScope, isInjectable } from './injectable';

/**
 * Base class for dependency injection containers.
 *
 * Extend this class to create request-scoped or application-scoped containers
 * with custom dependencies available as getters.
 *
 * @example
 * ```typescript
 * class AppContainer extends DiContainer {
 *   get logger(): Logger {
 *     return new ConsoleLogger();
 *   }
 *
 *   get userService(): UserService {
 *     return this.newInstanceOf(UserService);
 *   }
 * }
 * ```
 */
export abstract class DiContainer {
  private readonly _singletons = new Map<Function, unknown>();

  /**
   * Checks if a dependency with the given token is available.
   * @param token - The string token identifying the dependency
   * @returns true if the dependency exists
   */
  public has(token: string): boolean {
    return (this as Record<string, unknown>)[token] !== undefined;
  }

  /**
   * Resolves a dependency by its string token.
   * @param token - The string token identifying the dependency
   * @returns The resolved dependency
   * @throws DiraError if no provider is found for the token
   *
   * @example
   * ```typescript
   * const logger = container.resolve<Logger>('logger');
   * ```
   */
  public resolve<T>(token: string): T {
    const value = (this as Record<string, unknown>)[token];
    if (value === undefined) {
      throw new DiraError(`No provider for token: ${token}`);
    }
    return value as T;
  }

  /**
   * Creates an instance of a class, automatically injecting its dependencies.
   *
   * For classes decorated with `@Injectable()`, properties marked with
   * `@Inject("token")` are automatically resolved from this container.
   *
   * For singleton-scoped injectables, the same instance is returned on subsequent calls.
   *
   * @param constructor - The class constructor to instantiate
   * @returns A new instance (or cached singleton) of the class
   * @throws DiraError if a dependency cannot be resolved
   *
   * @example
   * ```typescript
   * @Injectable()
   * class UserService {
   *   @Inject('logger') logger!: Logger;
   * }
   *
   * const service = container.newInstanceOf(UserService);
   * ```
   */
  public newInstanceOf<T extends object>(
    constructor: new (...args: unknown[]) => T,
  ): T {
    if (isInjectable(constructor)) {
      const scope = getInjectableScope(constructor);

      // Return cached singleton if available
      if (scope === 'singleton') {
        if (this._singletons.has(constructor)) {
          return this._singletons.get(constructor) as T;
        }
      }

      // Create the instance
      const instance = new constructor();

      // Inject properties
      const injections = getInjectMetadata(constructor);
      for (const [prop, token] of injections) {
        (instance as Record<string | symbol, unknown>)[prop] =
          this.resolve(token);
      }

      // Cache singleton
      if (scope === 'singleton') {
        this._singletons.set(constructor, instance);
      }

      return instance;
    }

    // Fallback: plain instantiation for non-injectable classes
    return new constructor();
  }
}
