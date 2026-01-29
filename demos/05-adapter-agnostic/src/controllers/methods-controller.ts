import { DiraController, DiraHttp, type DiraRequest } from '@dira/core';

@DiraController('/methods')
export class MethodsController {
  @DiraHttp('/resource', { method: 'GET' })
  get(): { method: 'GET' } {
    return { method: 'GET' };
  }

  @DiraHttp('/resource', { method: 'POST' })
  post(): { method: 'POST' } {
    return { method: 'POST' };
  }

  @DiraHttp('/resource', { method: 'PUT' })
  put(): { method: 'PUT' } {
    return { method: 'PUT' };
  }

  @DiraHttp('/resource', { method: 'PATCH' })
  patch(): { method: 'PATCH' } {
    return { method: 'PATCH' };
  }

  @DiraHttp('/resource', { method: 'DELETE' })
  delete(): { method: 'DELETE' } {
    return { method: 'DELETE' };
  }

  @DiraHttp('/any-method')
  anyMethod(req: DiraRequest): { method: string } {
    return { method: req.method };
  }
}
