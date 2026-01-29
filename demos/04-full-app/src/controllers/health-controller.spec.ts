import { describe, expect, it, afterEach, beforeEach } from 'bun:test';
import { join } from 'node:path';
import { DiraCore } from '@dira/core';
import { HonoAdapter } from '@dira/adapter-hono';
import { AppRequest } from '../app-request';

describe('HealthController', () => {
  let adapter: HonoAdapter;
  let baseUrl: string;

  beforeEach(async () => {
    const dira = new DiraCore();
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
});
