import { describe, expect, it } from 'bun:test';
import { DiraCore } from '@dira/core';
import { HonoAdapter } from '@dira/adapter-hono';
import { HelloController } from './hello-controller';

describe('HelloController', () => {
  it('GET /api/hello returns expected JSON', async () => {
    const dira = new DiraCore();
    dira.registerController(new HelloController());

    const adapter = new HonoAdapter();
    await dira.run(adapter, { port: 0 });

    try {
      const response = await fetch(
        `http://${adapter.hostname}:${adapter.port}/api/hello`,
      );
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain(
        'application/json',
      );

      const body = (await response.json()) as { message: string };
      expect(body).toEqual({ message: 'Hello, Dira!' });
    } finally {
      adapter.stop();
    }
  });
});
