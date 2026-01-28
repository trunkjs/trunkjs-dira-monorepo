import { DiraController, DiraHttp, handler } from '@dira/dira-core';
import type { DiraRequest } from '@dira/dira-core';

@DiraController('/methods')
export class MethodsController {
  @DiraHttp('/get-only', { method: 'GET' })
  getOnly(req: DiraRequest) {
    return { method: req.method };
  }

  @DiraHttp('/post-only', { method: 'POST' })
  postOnly(req: DiraRequest) {
    return { method: req.method };
  }

  @DiraHttp('/multiple', { method: ['GET', 'POST', 'PUT'] })
  multiple(req: DiraRequest) {
    return { method: req.method };
  }

  // Using handler() with method binding
  @DiraHttp({ method: 'DELETE' })
  deleteItem = handler('/:id/delete', (req) => {
    return { deleted: req.params.id, method: req.method };
  });
}
