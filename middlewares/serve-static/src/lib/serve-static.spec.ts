import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { serveStatic, createStaticHandler } from './serve-static';
import type { DiraMiddleware, MiddlewareNext, DiraHttpRequest } from '@dira/core';

// Helper to create a mock request
function createMockRequest(
  path: string,
  method = 'GET',
  headers: Record<string, string> = {},
): { method: string; url: string; headers: Headers } {
  return {
    method,
    url: `http://localhost${path}`,
    headers: new Headers(headers),
  };
}

// Helper to invoke middleware with mock next
async function invokeMiddleware(
  middleware: DiraMiddleware,
  request: ReturnType<typeof createMockRequest>,
  nextResponse: Response = new Response('next called'),
): Promise<Response> {
  const next: MiddlewareNext = async () => nextResponse;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return middleware(request as any, next);
}

describe('serveStatic', () => {
  let testDir: string;

  beforeAll(async () => {
    // Create temp directory with test files
    testDir = await mkdtemp(join(tmpdir(), 'serve-static-test-'));
    await writeFile(join(testDir, 'index.html'), '<html>index</html>');
    await writeFile(join(testDir, 'style.css'), 'body {}');
    await writeFile(join(testDir, 'script.js'), 'console.log("hi")');
    await mkdir(join(testDir, 'assets'));
    await writeFile(
      join(testDir, 'assets', 'logo.png'),
      Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    ); // PNG header
    await mkdir(join(testDir, 'subdir'));
    await writeFile(
      join(testDir, 'subdir', 'index.html'),
      '<html>subdir</html>',
    );
  });

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('basic file serving', () => {
    it('serves file from root', async () => {
      const middleware = serveStatic({ root: testDir });
      const response = await invokeMiddleware(
        middleware,
        createMockRequest('/style.css'),
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe(
        'text/css; charset=utf-8',
      );
      expect(await response.text()).toBe('body {}');
    });

    it('serves index.html for root path', async () => {
      const middleware = serveStatic({ root: testDir });
      const response = await invokeMiddleware(
        middleware,
        createMockRequest('/'),
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe(
        'text/html; charset=utf-8',
      );
      expect(await response.text()).toBe('<html>index</html>');
    });

    it('serves index.html for directory path', async () => {
      const middleware = serveStatic({ root: testDir });
      const response = await invokeMiddleware(
        middleware,
        createMockRequest('/subdir/'),
      );

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('<html>subdir</html>');
    });

    it('serves nested file', async () => {
      const middleware = serveStatic({ root: testDir });
      const response = await invokeMiddleware(
        middleware,
        createMockRequest('/assets/logo.png'),
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/png');
    });
  });

  describe('prefix handling', () => {
    it('serves files under prefix', async () => {
      const middleware = serveStatic({ root: testDir, prefix: '/static' });
      const response = await invokeMiddleware(
        middleware,
        createMockRequest('/static/style.css'),
      );

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('body {}');
    });

    it('calls next for non-matching prefix with fallthrough', async () => {
      const middleware = serveStatic({ root: testDir, prefix: '/static' });
      const response = await invokeMiddleware(
        middleware,
        createMockRequest('/other/style.css'),
      );

      expect(await response.text()).toBe('next called');
    });

    it('returns 404 for non-matching prefix without fallthrough', async () => {
      const middleware = serveStatic({
        root: testDir,
        prefix: '/static',
        fallthrough: false,
      });
      const response = await invokeMiddleware(
        middleware,
        createMockRequest('/other/style.css'),
      );

      expect(response.status).toBe(404);
    });
  });

  describe('HTTP methods', () => {
    it('handles GET request', async () => {
      const middleware = serveStatic({ root: testDir });
      const response = await invokeMiddleware(
        middleware,
        createMockRequest('/style.css', 'GET'),
      );

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('body {}');
    });

    it('handles HEAD request (no body)', async () => {
      const middleware = serveStatic({ root: testDir });
      const response = await invokeMiddleware(
        middleware,
        createMockRequest('/style.css', 'HEAD'),
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe(
        'text/css; charset=utf-8',
      );
      expect(response.headers.get('Content-Length')).toBe('7');
      expect(await response.text()).toBe('');
    });

    it('calls next for POST with fallthrough', async () => {
      const middleware = serveStatic({ root: testDir });
      const response = await invokeMiddleware(
        middleware,
        createMockRequest('/style.css', 'POST'),
      );

      expect(await response.text()).toBe('next called');
    });

    it('returns 405 for POST without fallthrough', async () => {
      const middleware = serveStatic({ root: testDir, fallthrough: false });
      const response = await invokeMiddleware(
        middleware,
        createMockRequest('/style.css', 'POST'),
      );

      expect(response.status).toBe(405);
    });
  });

  describe('security', () => {
    it('blocks path traversal via resolveSafePath', async () => {
      // Note: URL normalization happens before we receive the path,
      // so standard "/../" traversal is normalized by the URL parser.
      // The real protection is in resolveSafePath which we test directly.
      // This test verifies the middleware returns 404 (file not found)
      // for normalized paths that don't exist, not that it blocks "/../".
      const middleware = serveStatic({ root: testDir, fallthrough: false });
      const response = await invokeMiddleware(
        middleware,
        createMockRequest('/etc/passwd'),
      );

      // /etc/passwd doesn't exist in testDir, so returns 404
      expect(response.status).toBe(404);
    });

    it('blocks fully-encoded path traversal', async () => {
      const middleware = serveStatic({ root: testDir });
      // When slashes are also encoded, URL doesn't normalize
      const response = await invokeMiddleware(
        middleware,
        createMockRequest('/%2e%2e%2f%2e%2e%2fetc%2fpasswd'),
      );

      expect(response.status).toBe(403);
    });

    it('blocks null byte injection', async () => {
      const middleware = serveStatic({ root: testDir });
      // Null bytes must be encoded to survive URL parsing
      const response = await invokeMiddleware(
        middleware,
        createMockRequest('/style.css%00.txt'),
      );

      expect(response.status).toBe(403);
    });
  });

  describe('caching', () => {
    it('includes ETag header by default', async () => {
      const middleware = serveStatic({ root: testDir });
      const response = await invokeMiddleware(
        middleware,
        createMockRequest('/style.css'),
      );

      expect(response.headers.get('ETag')).toMatch(/^W\/".+"$/);
    });

    it('includes Last-Modified header by default', async () => {
      const middleware = serveStatic({ root: testDir });
      const response = await invokeMiddleware(
        middleware,
        createMockRequest('/style.css'),
      );

      expect(response.headers.get('Last-Modified')).toBeTruthy();
    });

    it('returns 304 for matching ETag', async () => {
      const middleware = serveStatic({ root: testDir });

      // First request to get ETag
      const first = await invokeMiddleware(
        middleware,
        createMockRequest('/style.css'),
      );
      const etag = first.headers.get('ETag')!;

      // Second request with If-None-Match
      const second = await invokeMiddleware(
        middleware,
        createMockRequest('/style.css', 'GET', { 'If-None-Match': etag }),
      );

      expect(second.status).toBe(304);
    });

    it('returns 304 for If-Modified-Since', async () => {
      const middleware = serveStatic({
        root: testDir,
        cache: { etag: false, lastModified: true },
      });

      // First request to get Last-Modified
      const first = await invokeMiddleware(
        middleware,
        createMockRequest('/style.css'),
      );
      const lastModified = first.headers.get('Last-Modified')!;

      // Second request with If-Modified-Since (future date)
      const futureDate = new Date(Date.now() + 86400000).toUTCString();
      const second = await invokeMiddleware(
        middleware,
        createMockRequest('/style.css', 'GET', {
          'If-Modified-Since': futureDate,
        }),
      );

      expect(second.status).toBe(304);
    });

    it('sets Cache-Control with maxAge', async () => {
      const middleware = serveStatic({
        root: testDir,
        cache: { maxAge: 3600 },
      });
      const response = await invokeMiddleware(
        middleware,
        createMockRequest('/style.css'),
      );

      expect(response.headers.get('Cache-Control')).toBe(
        'public, max-age=3600',
      );
    });

    it('disables ETag when configured', async () => {
      const middleware = serveStatic({ root: testDir, cache: { etag: false } });
      const response = await invokeMiddleware(
        middleware,
        createMockRequest('/style.css'),
      );

      expect(response.headers.get('ETag')).toBeNull();
    });

    it('disables Last-Modified when configured', async () => {
      const middleware = serveStatic({
        root: testDir,
        cache: { lastModified: false },
      });
      const response = await invokeMiddleware(
        middleware,
        createMockRequest('/style.css'),
      );

      expect(response.headers.get('Last-Modified')).toBeNull();
    });
  });

  describe('MIME types', () => {
    it('uses custom MIME type override', async () => {
      const middleware = serveStatic({
        root: testDir,
        mimeTypes: { '.css': 'text/plain' },
      });
      const response = await invokeMiddleware(
        middleware,
        createMockRequest('/style.css'),
      );

      expect(response.headers.get('Content-Type')).toBe('text/plain');
    });
  });

  describe('fallthrough behavior', () => {
    it('calls next for non-existent file with fallthrough (default)', async () => {
      const middleware = serveStatic({ root: testDir });
      const response = await invokeMiddleware(
        middleware,
        createMockRequest('/nonexistent.txt'),
      );

      expect(await response.text()).toBe('next called');
    });

    it('returns 404 for non-existent file without fallthrough', async () => {
      const middleware = serveStatic({ root: testDir, fallthrough: false });
      const response = await invokeMiddleware(
        middleware,
        createMockRequest('/nonexistent.txt'),
      );

      expect(response.status).toBe(404);
    });
  });

  describe('custom index files', () => {
    it('uses custom index file list', async () => {
      await writeFile(join(testDir, 'default.html'), '<html>default</html>');

      const middleware = serveStatic({
        root: testDir,
        index: ['default.html', 'index.html'],
      });
      const response = await invokeMiddleware(
        middleware,
        createMockRequest('/'),
      );

      expect(await response.text()).toBe('<html>default</html>');

      await rm(join(testDir, 'default.html'));
    });
  });
});

// Helper to create mock DiraHttpRequest for createStaticHandler
function createMockDiraRequest(
  path: string,
  method = 'GET',
  headers: Record<string, string> = {},
  params: Record<string, string> = {},
): DiraHttpRequest {
  return {
    method,
    url: `http://localhost${path}`,
    headers: new Headers(headers),
    params,
  } as unknown as DiraHttpRequest;
}

describe('createStaticHandler', () => {
  let testDir: string;

  beforeAll(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'static-handler-test-'));
    await writeFile(join(testDir, 'index.html'), '<html>index</html>');
    await writeFile(join(testDir, 'style.css'), 'body {}');
    await mkdir(join(testDir, 'assets'));
    await writeFile(join(testDir, 'assets', 'app.js'), 'console.log("app")');
  });

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('basic file serving', () => {
    it('serves file from root using URL pathname', async () => {
      const handler = createStaticHandler({ root: testDir });
      const response = await handler(createMockDiraRequest('/style.css'));

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('body {}');
    });

    it('serves index.html for root path', async () => {
      const handler = createStaticHandler({ root: testDir });
      const response = await handler(createMockDiraRequest('/'));

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('<html>index</html>');
    });
  });

  describe('wildcard path param support', () => {
    it('uses params.path when available', async () => {
      const handler = createStaticHandler({ root: testDir });
      // Simulate /static/::path route with request to /static/assets/app.js
      const response = await handler(
        createMockDiraRequest('/static/assets/app.js', 'GET', {}, { path: 'assets/app.js' }),
      );

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('console.log("app")');
    });

    it('uses params.path for root with empty string', async () => {
      const handler = createStaticHandler({ root: testDir });
      // Simulate /::path route with request to /
      const response = await handler(
        createMockDiraRequest('/', 'GET', {}, { path: '' }),
      );

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('<html>index</html>');
    });

    it('falls back to URL pathname when no params.path', async () => {
      const handler = createStaticHandler({ root: testDir });
      // No params provided
      const response = await handler(createMockDiraRequest('/style.css'));

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('body {}');
    });
  });

  describe('fallthrough behavior', () => {
    it('returns 404 for non-existent file by default', async () => {
      const handler = createStaticHandler({ root: testDir });
      const response = await handler(createMockDiraRequest('/nonexistent.txt'));

      expect(response.status).toBe(404);
      expect(await response.text()).toBe('Not Found');
    });

    it('returns empty 404 with fallthrough: true', async () => {
      const handler = createStaticHandler({ root: testDir, fallthrough: true });
      const response = await handler(createMockDiraRequest('/nonexistent.txt'));

      expect(response.status).toBe(404);
      expect(await response.text()).toBe('');
    });

    it('returns 405 for POST without fallthrough', async () => {
      const handler = createStaticHandler({ root: testDir });
      const response = await handler(createMockDiraRequest('/style.css', 'POST'));

      expect(response.status).toBe(405);
    });

    it('returns empty 404 for POST with fallthrough', async () => {
      const handler = createStaticHandler({ root: testDir, fallthrough: true });
      const response = await handler(createMockDiraRequest('/style.css', 'POST'));

      expect(response.status).toBe(404);
      expect(await response.text()).toBe('');
    });
  });

  describe('security', () => {
    it('blocks path traversal', async () => {
      const handler = createStaticHandler({ root: testDir });
      const response = await handler(
        createMockDiraRequest('/%2e%2e%2f%2e%2e%2fetc%2fpasswd'),
      );

      expect(response.status).toBe(403);
    });

    it('blocks null byte injection', async () => {
      const handler = createStaticHandler({ root: testDir });
      const response = await handler(
        createMockDiraRequest('/style.css%00.txt'),
      );

      expect(response.status).toBe(403);
    });
  });

  describe('caching', () => {
    it('includes ETag and Last-Modified by default', async () => {
      const handler = createStaticHandler({ root: testDir });
      const response = await handler(createMockDiraRequest('/style.css'));

      expect(response.headers.get('ETag')).toMatch(/^W\/".+"$/);
      expect(response.headers.get('Last-Modified')).toBeTruthy();
    });

    it('returns 304 for matching ETag', async () => {
      const handler = createStaticHandler({ root: testDir });
      const first = await handler(createMockDiraRequest('/style.css'));
      const etag = first.headers.get('ETag')!;

      const second = await handler(
        createMockDiraRequest('/style.css', 'GET', { 'If-None-Match': etag }),
      );

      expect(second.status).toBe(304);
    });
  });
});
