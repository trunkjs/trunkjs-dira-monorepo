import { describe, expect, it, afterEach, beforeEach } from 'bun:test';
import { join } from 'node:path';
import { DiraCore, errorHandlerMiddleware } from '@dira/core';
import { HonoAdapter } from '@dira/adapter-hono';
import { AppRequest } from '../app-request';
import { timingMiddleware } from '../middleware/timing-middleware';

describe('HealthController', () => {
  let adapter: HonoAdapter;
  let baseUrl: string;

  beforeEach(async () => {
    const dira = new DiraCore()
      .use(errorHandlerMiddleware())
      .use(timingMiddleware);

    dira.setRequestClass(AppRequest);
    await dira.discover(join(import.meta.dirname, '.'));
    adapter = new HonoAdapter();
    await dira.run(adapter, { port: 0 });
    baseUrl = `http://${adapter.hostname}:${adapter.port}`;
  });

  afterEach(() => {
    adapter?.stop();
  });

  it('health check returns ok', async () => {
    // Note: /health/ with trailing slash because route is /health + /
    const response = await fetch(`${baseUrl}/health/`);
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      status: string;
      timestamp: string;
    };
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
  });

  it('health check includes X-Response-Time header', async () => {
    const response = await fetch(`${baseUrl}/health/`);
    expect(response.headers.has('X-Response-Time')).toBe(true);
    expect(response.headers.get('X-Response-Time')).toMatch(/^\d+\.\d+ms$/);
  });
});
