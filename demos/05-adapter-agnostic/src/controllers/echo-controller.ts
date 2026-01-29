import { DiraController, DiraHttp, type DiraRequest } from '@dira/core';

@DiraController('/echo')
export class EchoController {
  @DiraHttp('/message', { method: 'GET' })
  getMessage(req: DiraRequest): { method: string; path: string } {
    return { method: req.method, path: '/echo/message' };
  }

  @DiraHttp('/message', { method: 'POST' })
  postMessage(req: DiraRequest<{ text: string }>): {
    method: string;
    text: string;
  } {
    const body = req.body;
    return { method: req.method, text: body.text };
  }

  @DiraHttp('/query', { method: 'GET' })
  getWithQuery(req: DiraRequest<unknown, { name: string; count: string }>): {
    name: string;
    count: number;
  } {
    const query = req.query;
    return { name: query.name, count: parseInt(query.count, 10) };
  }
}
