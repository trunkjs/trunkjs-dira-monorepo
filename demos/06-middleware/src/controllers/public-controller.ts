import { DiraController, DiraHttp, type DiraHttpRequest } from '@dira/core';
import { type LogContext } from '../middleware/logging-middleware';

/**
 * Public controller - no authentication required.
 * Only global middleware (error handler, timing, logging) applies.
 */
@DiraController('', { name: 'public' })
export class PublicController {
  @DiraHttp('/health', { method: 'GET', name: 'health' })
  health(req: DiraHttpRequest & { ctx: LogContext }) {
    return {
      status: 'ok',
      requestId: req.ctx.requestId,
    };
  }

  @DiraHttp('/echo', { method: 'POST', name: 'echo' })
  async echo(req: DiraHttpRequest & { ctx: LogContext }) {
    const body = await req.json();
    return {
      received: body,
      requestId: req.ctx.requestId,
    };
  }
}
