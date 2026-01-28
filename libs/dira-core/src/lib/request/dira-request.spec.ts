import { DiFactory } from '../container/di-container';
import { DiraRequest } from './dira-request';

class MyFactories extends DiFactory<MyFactories> {
  get customerId() {
    return 'customer-1234';
  }

  get customer(): unknown {
    return this.container.customerId;
  }
}

// Compile-time Assertions: wenn diese Datei kompiliert, ist die Request-Surface korrekt typisiert.
{
  const factories = new MyFactories();
  const req = DiraRequest.from(factories);

  // Container-Getter/Values sind als Properties sichtbar:
  const id: string = req.customerId;
  const customer: unknown = req.customer;

  // Eigene Klasseigenschaft bleibt erreichbar:
  const f: MyFactories = req.factory;

  void id;
  void customer;
  void f;
}
