import { DiraController, DiraHttp } from '@dira/dira-core';

@DiraController('/api')
export class HelloController {
  @DiraHttp('/hello')
  async hello(_req: Request): Promise<Response> {
    return new Response('Hello from decorator!');
  }

  @DiraHttp('/health')
  async health(_req: Request): Promise<Response> {
    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
