import { DiraController, DiraHttp } from '@dira/core';

@DiraController('/health', { name: 'health' })
export class HealthController {
  @DiraHttp('/', { name: 'check' })
  check(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
