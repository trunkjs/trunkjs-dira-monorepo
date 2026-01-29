/**
 * Scope determining how instances are managed.
 * - `transient`: A new instance is created for each request (default)
 * - `singleton`: A single instance is shared across all requests within a container
 */
export type Scope = 'transient' | 'singleton';

/**
 * WeakMap storing injectable metadata per class constructor.
 */
const injectableMetadataMap = new WeakMap<Function, { scope: Scope }>();

/**
 * Class decorator that marks a class as injectable by the DI container.
 *
 * Classes marked with `@Injectable()` can have their `@Inject` decorated
 * properties automatically resolved when instantiated via `container.newInstanceOf()`.
 *
 * @param options - Configuration options
 * @param options.scope - Instance scope: 'transient' (default) or 'singleton'
 *
 * @example
 * ```typescript
 * // Transient scope (default) - new instance each time
 * @Injectable()
 * class UserService {
 *   @Inject('logger') logger!: Logger;
 * }
 *
 * // Singleton scope - same instance reused
 * @Injectable({ scope: 'singleton' })
 * class ConfigService {
 *   @Inject('env') env!: string;
 * }
 * ```
 */
export function Injectable(options?: { scope?: Scope }) {
  // Works with both stage 3 and legacy class decorators
  // Stage 3: (target, context) => target
  // Legacy: (target) => target
  return function <T extends new (...args: unknown[]) => object>(target: T): T {
    injectableMetadataMap.set(target, { scope: options?.scope ?? 'transient' });
    return target;
  };
}

/**
 * Checks if a class is decorated with `@Injectable()`.
 * @param target - The class constructor to check
 * @returns true if the class is injectable
 */
export function isInjectable(target: Function): boolean {
  return injectableMetadataMap.has(target);
}

/**
 * Gets the scope of an injectable class.
 * @param target - The class constructor
 * @returns The scope, or undefined if not injectable
 */
export function getInjectableScope(target: Function): Scope | undefined {
  return injectableMetadataMap.get(target)?.scope;
}
