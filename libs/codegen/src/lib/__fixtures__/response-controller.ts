import { DiraController, DiraHttp } from '@dira/core';

@DiraController('/raw')
export class RawController {
  @DiraHttp('/download')
  download(_req: Request): Response {
    return new Response('file');
  }

  @DiraHttp('/nothing')
  nothing() {
    return;
  }
}
