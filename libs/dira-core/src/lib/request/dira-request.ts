// Utility: Nur nicht-funktionale Keys (Getter/Values) vom Container übernehmen.
// Methoden werden bewusst ausgeschlossen, damit `req.foo()` nicht fälschlich als verfügbar gilt.
import { DiFactory } from '../container/di-container';
import type { ContainerShape } from '../container/di-container';

/**
 * `DiraRequest<TFactory>` ist eine typisierte "Surface" über einer DI-Factory:
 * - `factory` bleibt zugänglich
 * - alle nicht-funktionalen Getter/Values der Factory werden als Properties sichtbar
 *
 * Zur Laufzeit werden diese Properties via Proxy auf `factory.container` weitergeleitet.
 */
export type DiraRequest<TFactory extends DiFactory<any>> = {
  readonly factory: TFactory;
} & ContainerShape<TFactory>;

export class DiraRequestRuntime {
  /**
   * Erzeugt eine runtime-taugliche Request-Surface (Proxy), die Container-Properties auflöst.
   */
  static from<TFactory extends DiFactory<any>>(factory: TFactory): DiraRequest<TFactory> {
    return new Proxy(
      { factory } as any,
      {
        get(target, prop, receiver) {
          if (prop === 'factory') return Reflect.get(target, prop, receiver);
          // Container-Shape liefert ausschließlich Nicht-Methoden-Properties aus der Factory.
          return (factory.container as any)[prop as any];
        },
        has(_target, prop) {
          if (prop === 'factory') return true;
          return prop in (factory.container as any);
        },
      },
    ) as any;
  }
}

// Backwards-compatible API: `DiraRequest.from(factory)` bleibt erhalten.
export const DiraRequest = DiraRequestRuntime;

/**
 * Class-Variante von `DiraRequest`.
 *
 * - Typseitig macht sie Container-Values/Getters als Properties auf der Request-Instanz sichtbar.
 * - Runtime-seitig existieren diese Properties nicht automatisch.
 *   Falls du runtime-Weiterleitung willst, nutze `DiraRequest.from(factory)`.
 */
export abstract class DiraRequestFactory<Self extends DiraRequestFactory<Self>> extends DiFactory<Self> {
  /**
   * Type-only Helfer, um später `type MyReq = typeof MyFactories.requestType` schreiben zu können.
   * (Kein Runtime-Contract – die Property existiert nur fürs Typing.)
   */
  declare static readonly requestType: DiraRequest<any>;

  // Optional: Default-Getter für Framework/Adapter. Kann von Adaptern überschrieben werden.
  // Wir halten es absichtlich `unknown`, damit keine Node/Fetch/Hono Annahmen ins Core leaken.
  get request(): unknown {
    return undefined;
  }

  // Optional: (Path-)Params – Adapter-spezifisch. Defaults to empty.
  get params(): Record<string, string> {
    return {};
  }
}
