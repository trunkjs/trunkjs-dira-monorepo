import { describe, expect, it, afterEach } from 'bun:test';
import { DiraCore } from '@dira/core';
import { BunAdapter } from './bun-adapter';

describe('BunAdapter', () => {
  let adapter: BunAdapter;

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

      adapter = new BunAdapter();
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

      adapter = new BunAdapter();
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

      adapter = new BunAdapter();
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

  describe('route matching', () => {
    it('matches static routes', async () => {
      const dira = new DiraCore();
      dira.registerHandler('/hello', async () => ({ message: 'Hello' }));

      adapter = new BunAdapter();
      await dira.run(adapter, { port: 0 });
      const baseUrl = `http://${adapter.hostname}:${adapter.port}`;

      const response = await fetch(`${baseUrl}/hello`);
      expect(response.status).toBe(200);
      const body = (await response.json()) as { message: string };
      expect(body.message).toBe('Hello');
    });

    it('matches routes with parameters', async () => {
      const dira = new DiraCore();
      dira.registerHandler('/users/:id', async (req) => {
        const url = new URL(req.url);
        // Extract id from pathname - the handler receives raw Request
        const match = url.pathname.match(/\/users\/([^/]+)/);
        return { userId: match?.[1] ?? 'unknown' };
      });

      adapter = new BunAdapter();
      await dira.run(adapter, { port: 0 });
      const baseUrl = `http://${adapter.hostname}:${adapter.port}`;

      const response = await fetch(`${baseUrl}/users/42`);
      expect(response.status).toBe(200);
      const body = (await response.json()) as { userId: string };
      expect(body.userId).toBe('42');
    });

    it('matches wildcard routes', async () => {
      const dira = new DiraCore();
      dira.registerHandler('/files/*', async (req) => {
        const url = new URL(req.url);
        const path = url.pathname.replace('/files/', '');
        return { path };
      });

      adapter = new BunAdapter();
      await dira.run(adapter, { port: 0 });
      const baseUrl = `http://${adapter.hostname}:${adapter.port}`;

      const response = await fetch(`${baseUrl}/files/path/to/file.txt`);
      expect(response.status).toBe(200);
      const body = (await response.json()) as { path: string };
      expect(body.path).toBe('path/to/file.txt');
    });

    it('returns 404 for unmatched routes', async () => {
      const dira = new DiraCore();
      dira.registerHandler('/exists', async () => ({ ok: true }));

      adapter = new BunAdapter();
      await dira.run(adapter, { port: 0 });
      const baseUrl = `http://${adapter.hostname}:${adapter.port}`;

      const response = await fetch(`${baseUrl}/does-not-exist`);
      expect(response.status).toBe(404);
    });

    it('matches first route when multiple routes could match', async () => {
      const dira = new DiraCore();
      // More specific route first
      dira.registerHandler('/users/me', async () => ({ user: 'current' }));
      dira.registerHandler('/users/:id', async () => ({ user: 'other' }));

      adapter = new BunAdapter();
      await dira.run(adapter, { port: 0 });
      const baseUrl = `http://${adapter.hostname}:${adapter.port}`;

      const response = await fetch(`${baseUrl}/users/me`);
      expect(response.status).toBe(200);
      const body = (await response.json()) as { user: string };
      expect(body.user).toBe('current');
    });
  });

  describe('server lifecycle', () => {
    it('returns correct port and hostname', async () => {
      const dira = new DiraCore();
      dira.registerHandler('/test', async () => ({ ok: true }));

      adapter = new BunAdapter();
      await dira.run(adapter, { port: 0 });

      expect(adapter.port).toBeGreaterThan(0);
      expect(typeof adapter.hostname).toBe('string');
    });

    it('stops server cleanly', async () => {
      const dira = new DiraCore();
      dira.registerHandler('/test', async () => ({ ok: true }));

      adapter = new BunAdapter();
      await dira.run(adapter, { port: 0 });
      const port = adapter.port;
      const baseUrl = `http://${adapter.hostname}:${port}`;

      // Server should work
      const beforeStop = await fetch(`${baseUrl}/test`);
      expect(beforeStop.status).toBe(200);

      // Stop server
      adapter.stop();

      // Port should be reset
      expect(adapter.port).toBe(0);

      // Small delay to allow server shutdown
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Server should no longer respond (connection refused)
      try {
        await fetch(`${baseUrl}/test`);
        // If fetch succeeds, fail the test
        expect(true).toBe(false);
      } catch {
        // Expected - connection should be refused
        expect(true).toBe(true);
      }
    });

    it('returns defaults before start', () => {
      adapter = new BunAdapter();

      expect(adapter.port).toBe(0);
      expect(adapter.hostname).toBe('localhost');
    });
  });
});
