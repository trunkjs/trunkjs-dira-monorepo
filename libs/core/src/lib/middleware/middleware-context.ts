/** Symbol key for middleware context storage on requests. */
export const MIDDLEWARE_CONTEXT = Symbol('dira:middleware:context');

/**
 * Type-safe context store that holds middleware-provided values.
 * Attached to requests for sharing data across middleware chain.
 */
export class ContextStore {
  private data: Record<string, unknown> = {};

  /** Sets a value in the context store. */
  set<K extends string, V>(key: K, value: V): void {
    this.data[key] = value;
  }

  /** Gets a value from the context store. */
  get<K extends string>(key: K): unknown {
    return this.data[key];
  }

  /** Checks if a key exists in the context store. */
  has(key: string): boolean {
    return key in this.data;
  }

  /** Returns all stored data as a record. */
  getAll(): Record<string, unknown> {
    return { ...this.data };
  }
}

/**
 * Creates a proxy that provides type-safe access to context values.
 * The proxy intercepts property access and delegates to the ContextStore.
 *
 * @param request - The request object to augment
 * @param store - The context store to use for storage
 * @returns The request with a typed ctx property
 */
export function attachContext<TRequest extends object, TContext>(
  request: TRequest,
  store: ContextStore,
): TRequest & { ctx: TContext } {
  const ctxProxy = new Proxy(
    {},
    {
      get(_target, prop: string) {
        return store.get(prop);
      },
      set(_target, prop: string, value: unknown) {
        store.set(prop, value);
        return true;
      },
      has(_target, prop: string) {
        return store.has(prop);
      },
      ownKeys() {
        return Object.keys(store.getAll());
      },
      getOwnPropertyDescriptor(_target, prop: string) {
        if (store.has(prop)) {
          return {
            value: store.get(prop),
            writable: true,
            enumerable: true,
            configurable: true,
          };
        }
        return undefined;
      },
    },
  ) as TContext;

  return Object.assign(request, { ctx: ctxProxy });
}

/**
 * Creates a new ContextStore instance.
 * @returns A fresh context store
 */
export function createContextStore(): ContextStore {
  return new ContextStore();
}
