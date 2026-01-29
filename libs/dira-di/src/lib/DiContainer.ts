import { getInjectedTokens } from "./decorator-inject";
import { getInjectableScope, isInjectable } from "./decorator-injectable";

export class DiContainer {
  private readonly __singletons = new Map<Function, unknown>();

  public has(token: string): boolean {
    return (this as any)[token] !== undefined;
  }

  public resolve<T>(token: string): T {
    const value = (this as any)[token];
    if (value === undefined) {
      throw new Error(`No provider for token: ${token}`);
    }
    return value as T;
  }

  public newInstanceOf<T>(constructor: new (...args: any[]) => T): T {
    // Optional: unterstütze Injectable-Singletons.
    if (isInjectable(constructor)) {
      const scope = getInjectableScope(constructor);
      if (scope === "singleton") {
        if (this.__singletons.has(constructor)) {
          return this.__singletons.get(constructor) as T;
        }
      }

      const tokens = getInjectedTokens(constructor);
      const maxIndex = tokens.size ? Math.max(...Array.from(tokens.keys())) : -1;
      const args: any[] = [];
      for (let i = 0; i <= maxIndex; i++) {
        const token = tokens.get(i);
        if (token === undefined) {
          // Kein Token bekannt: wir können ohne reflect-metadata nicht raten.
          throw new Error(
            `Cannot resolve constructor param #${i} of ${(constructor as any).name ?? "<anonymous>"}. ` +
              `Add @Inject(\"token\") to that parameter.`,
          );
        }
        args[i] = this.resolve(token);
      }

      const instance = new constructor(...args);
      if (scope === "singleton") {
        this.__singletons.set(constructor, instance);
      }
      return instance;
    }

    // Fallback: plain instantiation.
    return new constructor();
  }

}