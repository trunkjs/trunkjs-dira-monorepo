export type InjectionToken = string;

type ParamIndex = number;

// Speichert pro Klasse (Constructor Function) die Param-Token pro Parameterindex.
// Map<target, Map<index, token>>
const injectMeta = new WeakMap<Function, Map<ParamIndex, InjectionToken>>();

type ConstructorParamContext = {
  kind: "parameter";
  name: "constructor";
  index: number;
  metadata?: { constructor?: Function };
};

/**
 * Parameter-Decorator: @Inject("token")
 *
 * Orientiert sich am Stil von `decorator-injectable.ts` (WeakMap-Metadaten + Helper).
 */
export function Inject(token: InjectionToken) {
  return function (_value: unknown, context: ConstructorParamContext) {
    // Wir unterstützen nur constructor-Parameter.
    if (context.kind !== "parameter" || context.name !== "constructor") {
      throw new Error("@Inject() kann nur auf constructor-Parameter angewendet werden.");
    }

    const target = context.metadata?.constructor as Function | undefined;
    if (!target) {
      throw new Error("@Inject(): Konnte den Ziel-Constructor nicht bestimmen (fehlende decorator metadata).");
    }

    let params = injectMeta.get(target);
    if (!params) {
      params = new Map();
      injectMeta.set(target, params);
    }

    params.set(context.index, token);
  };
}

export function getInjectedToken(target: Function, index: number): InjectionToken | undefined {
  return injectMeta.get(target)?.get(index);
}

export function getInjectedTokens(target: Function): ReadonlyMap<number, InjectionToken> {
  return injectMeta.get(target) ?? new Map();
}
