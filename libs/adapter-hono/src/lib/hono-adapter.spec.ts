import { describe, expect, it, afterEach } from 'bun:test';
import { DiraCore } from '@dira/core';
import { HonoAdapter } from './hono-adapter';

describe('HonoAdapter', () => {
  let adapter: HonoAdapter;

  afterEach(() => {
    adapter?.stop();
  });

  describe('method routing', () => {
    it('handles multiple methods on the same path', async () => {
      const dira = new DiraCore();
      dira.registerHandler(
        '/resource',
        async (req) => ({ method: req.method }),
        { method: ['GET', 'POST'] },
      );

      adapter = new HonoAdapter();
      await dira.run(adapter, { port: 0 });
      const baseUrl = `http://${adapter.hostname}:${adapter.port}`;

      // GET should work
      const getResponse = await fetch(`${baseUrl}/resource`);
      expect(getResponse.status).toBe(200);
      const getBody = (await getResponse.json()) as { method: string };
      expect(getBody.method).toBe('GET');

      // POST should work
      const postResponse = await fetch(`${baseUrl}/resource`, {
        method: 'POST',
      });
      expect(postResponse.status).toBe(200);
      const postBody = (await postResponse.json()) as { method: string };
      expect(postBody.method).toBe('POST');
    });

    it('returns 405 with Allow header for disallowed methods', async () => {
      const dira = new DiraCore();
      dira.registerHandler('/resource', async () => ({ ok: true }), {
        method: ['GET', 'POST'],
      });

      adapter = new HonoAdapter();
      await dira.run(adapter, { port: 0 });
      const baseUrl = `http://${adapter.hostname}:${adapter.port}`;

      // PUT should return 405
      const putResponse = await fetch(`${baseUrl}/resource`, {
        method: 'PUT',
      });
      expect(putResponse.status).toBe(405);
      expect(putResponse.headers.get('Allow')).toBe('GET, POST');

      // DELETE should return 405
      const deleteResponse = await fetch(`${baseUrl}/resource`, {
        method: 'DELETE',
      });
      expect(deleteResponse.status).toBe(405);
      expect(deleteResponse.headers.get('Allow')).toBe('GET, POST');
    });

    it('allows all methods when no methods specified', async () => {
      const dira = new DiraCore();
      dira.registerHandler('/any', async (req) => ({ method: req.method }));

      adapter = new HonoAdapter();
      await dira.run(adapter, { port: 0 });
      const baseUrl = `http://${adapter.hostname}:${adapter.port}`;

      for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
        const response = await fetch(`${baseUrl}/any`, { method });
        expect(response.status).toBe(200);
        const body = (await response.json()) as { method: string };
        expect(body.method).toBe(method);
      }
    });
  });
});
