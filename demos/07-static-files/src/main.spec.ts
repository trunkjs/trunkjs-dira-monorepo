import { describe, expect, it, afterEach } from 'bun:test';
import { resolve } from 'node:path';
import { DiraCore } from '@dira/core';
import { HonoAdapter } from '@dira/adapter-hono';
import { createStaticHandler } from '@dira/serve-static';
import { ApiController } from './controllers/api-controller';

describe('07-static-files demo', () => {
  let adapter: HonoAdapter;

  afterEach(() => {
    adapter?.stop();
  });

  async function createServer() {
    const publicDir = resolve(import.meta.dirname, '../public');

    const dira = new DiraCore()
      .registerController(new ApiController())
      .registerHandler(
        '/::path',
        createStaticHandler({
          root: publicDir,
          cache: { maxAge: 3600 },
        }),
        { method: 'get', name: 'static' },
      );

    adapter = new HonoAdapter();
    await dira.run(adapter, { port: 0 });
    const baseUrl = `http://${adapter.hostname}:${adapter.port}`;
    console.log(`Server running at ${baseUrl}`);
    return baseUrl;
  }

  it('serves index.html for root path', async () => {
    const baseUrl = await createServer();
    const response = await fetch(baseUrl);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe(
      'text/html; charset=utf-8',
    );

    const text = await response.text();
    expect(text).toContain('Dira Static Files Demo');
  });

  it('serves CSS files with correct MIME type', async () => {
    const baseUrl = await createServer();
    const response = await fetch(`${baseUrl}/assets/style.css`);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe(
      'text/css; charset=utf-8',
    );
  });

  it('serves JS files with correct MIME type', async () => {
    const baseUrl = await createServer();
    const response = await fetch(`${baseUrl}/assets/script.js`);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe(
      'text/javascript; charset=utf-8',
    );
  });

  it('returns cache headers', async () => {
    const baseUrl = await createServer();
    const response = await fetch(`${baseUrl}/assets/style.css`);
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
    expect(response.headers.get('ETag')).toBeTruthy();
    expect(response.headers.get('Last-Modified')).toBeTruthy();
  });

  it('returns 304 for conditional request with matching ETag', async () => {
    const baseUrl = await createServer();
    const first = await fetch(`${baseUrl}/assets/style.css`);
    const etag = first.headers.get('ETag');

    const second = await fetch(`${baseUrl}/assets/style.css`, {
      headers: { 'If-None-Match': etag! },
    });

    expect(second.status).toBe(304);
  });

  it('passes through to API routes', async () => {
    const baseUrl = await createServer();
    const response = await fetch(`${baseUrl}/api/health`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  it('returns 404 for non-existent static files (fallthrough to next)', async () => {
    const baseUrl = await createServer();
    const response = await fetch(`${baseUrl}/nonexistent.txt`);
    // With fallthrough enabled, the request goes to next middleware
    // Since there's no matching route, the adapter returns 404
    expect(response.status).toBe(404);
  });
});
