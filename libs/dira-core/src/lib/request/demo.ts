import { DiFactory } from '../container/di-container';
import { DiraRequest, DiraRequestFactory } from './dira-request';


class MyFactories extends DiraRequestFactory<MyFactories> {
  get customerId() {
    return 'customer-1234';
  }

  get customer(): unknown {
    return this.container.customerId;
  }
}

// Usage later in code

type MyRequest = MyFactories.getType;


function demo(req: MyRequest) {
  // Container-Getter/Values sind als Properties sichtbar:
  const id = req.customerId;
}