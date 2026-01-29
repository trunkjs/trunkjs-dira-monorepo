export type Scope = "transient" | "singleton";
const injectableMeta = new WeakMap<Function, { scope: Scope }>();

export function Injectable(opts?: { scope?: Scope }) {
  return function (target: Function, _context?: ClassDecoratorContext) {
    injectableMeta.set(target, { scope: opts?.scope ?? "transient" });
  };
}


export function isInjectable(target: Function): boolean {
  return injectableMeta.has(target);
}

export function getInjectableScope(target: Function): Scope | undefined {
  const meta = injectableMeta.get(target);
  return meta?.scope;
}