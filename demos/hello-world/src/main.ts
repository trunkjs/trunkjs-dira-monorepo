import { join } from 'node:path';
import { DiFactory, DiraCore, DiraRequest } from '@dira/dira-core';
import { HonoAdapter } from '@dira/adapter-hono';

const dira = new DiraCore();



// The Actual Factory Implementation
class MyFactories extends DiFactory<MyFactories> {
  get customerId() {
    return 'customer-1234';
  }

  get customer(): unknown {
    return this.container.customerId;
  }
}

// Usage later in code

const MyRequest =  MyFactories.getRequestPrototype<MyFactories>();cccccbrdegtecfdrcgfgcjjjltnlehjnnigtkcjelbkf



dira.httpRequestPrototype = MyRequest;


// Should call MyFactories.customerId once and cache the result


await dira.discover(join(import.meta.dirname, 'controllers'));

await dira.run(new HonoAdapter(), { port: 3000 });
