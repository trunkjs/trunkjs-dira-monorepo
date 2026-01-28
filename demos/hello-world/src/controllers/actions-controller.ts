import { DiraController, DiraHttp } from '@dira/dira-core';

@DiraController('/actions')
export class ActionsController {
  private counter = 0;

  @DiraHttp('/void')
  doVoidAction() {
    this.counter++;
    // No return - results in 204 No Content
  }

  @DiraHttp('/null')
  doNullAction() {
    this.counter++;
    return null; // Explicit null - results in 204 No Content
  }

  @DiraHttp('/counter')
  getCounter() {
    return { counter: this.counter };
  }

  @DiraHttp('/reset')
  resetCounter() {
    this.counter = 0;
    return null;
  }

  @DiraHttp('/custom-response')
  customResponse() {
    return new Response('Custom response body', {
      status: 201,
      headers: {
        'X-Custom-Header': 'custom-value',
        'Content-Type': 'text/plain',
      },
    });
  }

  @DiraHttp('/async-void')
  async asyncVoidAction() {
    await Promise.resolve();
    // Async with no return
  }

  @DiraHttp('/async-data')
  async asyncDataAction() {
    const data = await Promise.resolve({ async: true, timestamp: Date.now() });
    return data;
  }

  @DiraHttp('/sync-object')
  syncObject() {
    return { sync: true, type: 'object' };
  }

  @DiraHttp('/sync-array')
  syncArray() {
    return [1, 2, 3, 'four', { five: 5 }];
  }

  @DiraHttp('/sync-number')
  syncNumber() {
    return 42;
  }

  @DiraHttp('/sync-string')
  syncString() {
    return 'just a string';
  }

  @DiraHttp('/sync-boolean')
  syncBoolean() {
    return true;
  }
}
