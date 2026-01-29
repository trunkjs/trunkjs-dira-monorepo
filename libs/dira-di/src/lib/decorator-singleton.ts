


export function Singleton() {
  const perInstance = new WeakMap<object, unknown>();

  return function (value: any, context: ClassMethodDecoratorContext | ClassAccessorDecoratorContext) {
    if (context.kind === "method") {
      // same as before (optional)
      return function (this: object, ...args: any[]) {
        let cache = perInstance.get(this) as Map<string, unknown> | undefined;
        if (!cache) {
          cache = new Map();
          perInstance.set(this, cache);
        }

        const key = JSON.stringify(args);
        if (cache.has(key)) return cache.get(key);

        const result = value.apply(this, args);
        cache.set(key, result);
        return result;
      };
    }

    if (context.kind === "accessor") {
      const { get } = value;

      return {
        get(this: object) {
          if (perInstance.has(this)) {
            return perInstance.get(this);
          }

          const result = get.call(this);
          perInstance.set(this, result);
          return result;
        }
      };
    }

    throw new Error("@Service can only be used on methods or getters.");
  };
}
