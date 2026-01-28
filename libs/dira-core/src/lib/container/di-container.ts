// Famework stuff
// Utility-Types: extrahiere (nicht-funktionale) Property-Keys der Factory, um daraus den Container-Shape abzuleiten.

// Getter werden in TypeScript als Properties modelliert (nicht als Funktionen).
// Daher können wir Methoden hier nicht zuverlässig über `(...args)=>...` herausfiltern.
// Stattdessen übernehmen wir alle Keys (außer `container`) und entfernen Funktions-Properties später über den Typ.

type NonFunctionPropertyKeys<T> = {
  [K in keyof T]-?: T[K] extends Function ? never : K;
}[keyof T];

/**
 * Wichtig: 'container' muss VOR der Key-Extraktion entfernt werden, sonst entsteht eine zirkuläre Typ-Referenz
 * (weil MyFactories['container'] wiederum von MyFactories abhängt).
 */
type FactoryWithoutContainer<TFactory> = Omit<TFactory, 'container'>;

export type ContainerShape<TFactory> = {
  readonly [K in NonFunctionPropertyKeys<FactoryWithoutContainer<TFactory>>]: FactoryWithoutContainer<TFactory>[K];
};

/**
 * Getypter Container (Proxy): zur Laufzeit werden Properties zur Factory weitergeleitet.
 *
 * Wichtig: Die Klasse implementiert den Shape direkt, damit `TFactory['container']`
 * die tatsächlichen Keys (z.B. `customerId`) enthält und nicht nur ein Hilfsfeld.
 */
export class DiContainer<TFactory> {
  // Rein typisiert: Instanzen sollen wie der Container-Shape aussehen.
  declare readonly __factory?: TFactory;

  // Trick: ein "Konstruktor"-Helper, der einen Proxy liefert, aber sauber typisiert ist.
  static create<TFactory>(factory: TFactory): DiContainer<TFactory> & ContainerShape<TFactory> {
    return new Proxy(
      {},
      {
        get: (_target, prop) => (factory as any)[prop as any],
        has: (_target, prop) => prop in (factory as any),
      },
    ) as any;
  }
}

export abstract class DiFactory<Self extends DiFactory<Self>> {
  // Hilfsfeld nur fürs Typing: ermöglicht, den konkreten `Self`-Typ aus `typeof Subclass` zu inferieren.
  declare readonly __self?: Self;

  // In echt würde das einen Container/Proxy erzeugen und Werte lazy cachen.
  public get container(): DiContainer<Self> & ContainerShape<Self> {
    return DiContainer.create(this as any);
  }
}

// Example: (should work).
