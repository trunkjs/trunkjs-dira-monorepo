import { isStage3Decorator } from '@dira/common';

/**
 * String token used to identify dependencies for injection.
 */
export type InjectionToken = string;

/**
 * WeakMap storing injection metadata per class constructor.
 * Maps constructor -> Map of property names to injection tokens.
 */
const injectMetadataMap = new WeakMap<
  Function,
  Map<string | symbol, InjectionToken>
>();

/**
 * Registers an injection token for a property on a class constructor.
 */
function registerInjection(
  ctor: Function,
  propertyKey: string | symbol,
  token: InjectionToken,
): void {
  let props = injectMetadataMap.get(ctor);
  if (!props) {
    props = new Map();
    injectMetadataMap.set(ctor, props);
  }
  props.set(propertyKey, token);
}

/**
 * Property decorator that marks a property for dependency injection.
 *
 * Use this decorator on class properties to specify which dependency
 * should be injected when the class is instantiated via `container.newInstanceOf()`.
 *
 * @param token - The string token identifying the dependency to inject
 *
 * @example
 * ```typescript
 * @Injectable()
 * class UserService {
 *   @Inject('logger') logger!: Logger;
 *   @Inject('config') config!: Config;
 * }
 *
 * const service = container.newInstanceOf(UserService);
 * // service.logger and service.config are now populated
 * ```
 */
export function Inject(token: InjectionToken): {
  // Stage 3 field decorator
  <This, Value>(
    value: undefined,
    context: ClassFieldDecoratorContext<This, Value>,
  ): (this: This, initialValue: Value) => Value;
  // Legacy property decorator
  (target: object, propertyKey: string | symbol): void;
} {
  // Implementation signature is looser than overloads
  return function (
    targetOrValue: undefined | object,
    contextOrPropertyKey: ClassFieldDecoratorContext | string | symbol,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    if (isStage3Decorator(contextOrPropertyKey)) {
      // Stage 3 field decorator: return initializer to register on first instantiation
      const propertyKey = contextOrPropertyKey.name;
      return function (this: object, initialValue: unknown): unknown {
        registerInjection(this.constructor, propertyKey, token);
        return initialValue;
      };
    }

    // Legacy property decorator: register immediately
    const target = targetOrValue as object;
    const propertyKey = contextOrPropertyKey as string | symbol;
    registerInjection(target.constructor, propertyKey, token);
  };
}

/** Empty map returned for classes without injection metadata */
const EMPTY_MAP: ReadonlyMap<string | symbol, InjectionToken> = new Map();

/**
 * Gets all injection metadata for a class.
 * @param target - The class constructor
 * @returns Map of property names to injection tokens (empty if no injections)
 */
export function getInjectMetadata(
  target: Function,
): ReadonlyMap<string | symbol, InjectionToken> {
  return injectMetadataMap.get(target) ?? EMPTY_MAP;
}
