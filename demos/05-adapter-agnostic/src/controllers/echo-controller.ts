import { DiraController, DiraHttp, type DiraHttpRequest } from '@dira/core';

@DiraController('/echo')
export class EchoController {
  @DiraHttp('/message', { method: 'GET' })
  getMessage(req: DiraHttpRequest): { method: string; path: string } {
    return { method: req.method, path: '/echo/message' };
  }

  @DiraHttp('/message', { method: 'POST' })
  async postMessage(req: DiraHttpRequest<{ text: string }>): Promise<{
    method: string;
    text: string;
  }> {
    const body = await req.json();
    return { method: req.method, text: body.text };
  }

  @DiraHttp('/query', { method: 'GET' })
  getWithQuery(req: DiraHttpRequest<unknown, { name: string; count: string }>): {
    name: string;
    count: number;
  } {
    const query = req.query;
    return { name: query.name, count: parseInt(query.count, 10) };
  }
}
