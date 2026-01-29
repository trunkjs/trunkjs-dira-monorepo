import { DiraController, DiraHttp } from '@dira/dira-core';
import { MyRequest } from '../main';

@DiraController('/api')
export class EchoController {
  @DiraHttp('/echo')
  async echo(req: MyRequest): Promise<Response> {
    req.
    const url = new URL(req.url);
    const message = url.searchParams.get('message') ?? 'no message';
    return new Response(JSON.stringify({ echo: message }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  @DiraHttp('/time')
  async time(_req: Request): Promise<Response> {
    return new Response(JSON.stringify({ timestamp: Date.now() }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
