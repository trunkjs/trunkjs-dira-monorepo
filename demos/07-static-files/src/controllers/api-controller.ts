import { DiraController, DiraHttp } from '@dira/core';

@DiraController('/api', { name: 'api' })
export class ApiController {
  @DiraHttp('/health', { name: 'health' })
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'API is running alongside static files',
    };
  }
}
