import { describe, expect, it, afterEach } from 'bun:test';
import { HonoAdapter } from '@dira/adapter-hono';
import { BunAdapter } from '@dira/adapter-bun';
import type { DiraAdapter } from '@dira/core';
import { createApp } from './create-app';

/**
 * Unit tests that verify the static file demo works with both adapters.
 * This ensures the @dira/serve-static middleware is adapter-agnostic.
 */

describe.each([
  { name: 'HonoAdapter', createAdapter: () => new HonoAdapter() },
  { name: 'BunAdapter', createAdapter: () => new BunAdapter() },
])('07-static-files demo ($name)', ({ createAdapter }) => {
  let adapter: DiraAdapter;

  afterEach(() => {
    adapter?.stop();
  });

  async function createServer() {
    const dira = createApp();
    adapter = createAdapter();
    await dira.run(adapter, { port: 0 });
    const baseUrl = `http://${adapter.hostname}:${adapter.port}`;
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

  it('returns 404 for non-existent static files', async () => {
    const baseUrl = await createServer();
    const response = await fetch(`${baseUrl}/nonexistent.txt`);
    expect(response.status).toBe(404);
  });
});
