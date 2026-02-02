import { resolve } from 'node:path';
import { stat } from 'node:fs/promises';
import type { DiraMiddleware, DiraHttpRequest } from '@dira/core';
import type { ServeStaticOptions } from './serve-static-options';
import { resolveSafePath } from './resolve-safe-path';
import { getMimeType } from './mime-types';
import { generateEtag, isEtagMatch } from './etag';
import { buildCacheHeaders, isNotModifiedSince } from './cache-headers';

/**
 * Handler function type for static file serving.
 * Can be used with registerHandler for catch-all routes.
 */
export type StaticHandler = (request: DiraHttpRequest) => Promise<Response>;

/**
 * Create a static file serving middleware.
 *
 * This middleware serves files from a directory and supports:
 * - Automatic MIME type detection
 * - ETag and Last-Modified based caching
 * - Conditional requests (304 Not Modified)
 * - Path traversal protection
 * - Index file serving for directories
 *
 * When used with `dira.use()`, it runs as middleware on all routes.
 * The `fallthrough` option (default: true) allows requests for non-existent
 * files to continue to subsequent handlers.
 *
 * @param options - Configuration options for static file serving
 * @returns Dira middleware function
 *
 * @example
 * ```typescript
 * import { serveStatic } from '@dira/serve-static';
 *
 * // Serve files from ./public with caching
 * const dira = new DiraCore()
 *   .use(serveStatic({
 *     root: './public',
 *     prefix: '/static',
 *     cache: { maxAge: 3600 },
 *   }))
 *   .registerController(ApiController);
 * ```
 */
export function serveStatic(options: ServeStaticOptions): DiraMiddleware {
  const root = resolve(options.root);
  const prefix = options.prefix ?? '/';
  const indexFiles = options.index ?? ['index.html'];
  const fallthrough = options.fallthrough ?? true;
  const cacheOptions = {
    etag: true,
    lastModified: true,
    ...options.cache,
  };

  return async (request, next) => {
    const method = request.method;

    // Only handle GET and HEAD requests
    if (method !== 'GET' && method !== 'HEAD') {
      return fallthrough
        ? next()
        : new Response('Method Not Allowed', { status: 405 });
    }

    const url = new URL(request.url);
    let pathname = url.pathname;

    // Check prefix match
    if (!pathname.startsWith(prefix)) {
      return fallthrough ? next() : new Response('Not Found', { status: 404 });
    }

    // Remove prefix from path
    pathname = pathname.slice(prefix.length) || '/';

    // Ensure path starts with /
    if (!pathname.startsWith('/')) {
      pathname = '/' + pathname;
    }

    // Resolve safe path (prevents directory traversal)
    const filePath = resolveSafePath(root, pathname);
    if (!filePath) {
      return new Response('Forbidden', { status: 403 });
    }

    // Try to serve the file
    const result = await tryServeFile(
      filePath,
      indexFiles,
      method,
      request.headers,
      cacheOptions,
      options.mimeTypes,
      options.directoryListing ?? false,
    );

    if (result) {
      return result;
    }

    // File not found
    return fallthrough ? next() : new Response('Not Found', { status: 404 });
  };
}

/**
 * Create a static file handler for use with registerHandler.
 *
 * This is useful when you need to register static file serving as a catch-all
 * route handler rather than as middleware.
 *
 * When registered with a wildcard route like `/::path` or `/static/::path`,
 * the handler automatically uses the captured path segment. For root catch-all
 * routes, it uses the full URL pathname.
 *
 * @param options - Configuration options for static file serving
 * @returns Handler function that can be used with registerHandler
 *
 * @example
 * ```typescript
 * import { createStaticHandler } from '@dira/serve-static';
 *
 * // Register as a catch-all route (note: must be registered AFTER other routes)
 * const dira = new DiraCore()
 *   .registerController(ApiController)
 *   .registerHandler('/::path', createStaticHandler({
 *     root: './public',
 *   }), { method: 'get', name: 'static' });
 *
 * // Or with a prefix (the handler uses the captured ::path segment)
 * dira.registerHandler('/static/::path', createStaticHandler({
 *   root: './public',
 * }), { method: 'get', name: 'static' });
 * ```
 */
export function createStaticHandler(
  options: Omit<ServeStaticOptions, 'prefix'>,
): StaticHandler {
  const root = resolve(options.root);
  const indexFiles = options.index ?? ['index.html'];
  const fallthrough = options.fallthrough ?? false;
  const cacheOptions = {
    etag: true,
    lastModified: true,
    ...options.cache,
  };

  return async (request) => {
    const method = request.method;

    // Only handle GET and HEAD requests
    if (method !== 'GET' && method !== 'HEAD') {
      return fallthrough
        ? new Response(null, { status: 404 })
        : new Response('Method Not Allowed', { status: 405 });
    }

    // Use captured wildcard path if available (e.g., from /::path or /static/::path)
    // Otherwise fall back to the full URL pathname
    const params = request.params as Record<string, string> | undefined;
    const capturedPath = params?.path;
    const pathname = capturedPath !== undefined ? '/' + capturedPath : new URL(request.url).pathname;

    // Resolve safe path (prevents directory traversal)
    const filePath = resolveSafePath(root, pathname);
    if (!filePath) {
      return new Response('Forbidden', { status: 403 });
    }

    // Try to serve the file
    const result = await tryServeFile(
      filePath,
      indexFiles,
      method,
      request.headers,
      cacheOptions,
      options.mimeTypes,
      options.directoryListing ?? false,
    );

    if (result) {
      return result;
    }

    // File not found
    return fallthrough
      ? new Response(null, { status: 404 })
      : new Response('Not Found', { status: 404 });
  };
}

async function tryServeFile(
  filePath: string,
  indexFiles: string[],
  method: string,
  headers: Headers,
  cacheOptions: { etag: boolean; lastModified: boolean; maxAge?: number },
  customMimeTypes?: Record<string, string>,
  directoryListing?: boolean,
): Promise<Response | null> {
  try {
    const stats = await stat(filePath);

    // Handle directory
    if (stats.isDirectory()) {
      // Try index files
      for (const indexFile of indexFiles) {
        const indexPath = resolve(filePath, indexFile);
        const indexResult = await tryServeFile(
          indexPath,
          [],
          method,
          headers,
          cacheOptions,
          customMimeTypes,
          false,
        );
        if (indexResult) {
          return indexResult;
        }
      }

      // Directory listing not implemented (would return HTML listing)
      if (directoryListing) {
        // Future: implement directory listing
        return null;
      }

      return null;
    }

    // Must be a regular file
    if (!stats.isFile()) {
      return null;
    }

    // Build cache headers
    const { headers: cacheHeaders, etag } = buildCacheHeaders(
      stats.mtime,
      stats.size,
      cacheOptions,
      generateEtag,
    );

    // Check conditional request headers (ETag takes precedence)
    const ifNoneMatch = headers.get('If-None-Match');
    const ifModifiedSince = headers.get('If-Modified-Since');

    if (etag && isEtagMatch(ifNoneMatch, etag)) {
      return new Response(null, {
        status: 304,
        headers: cacheHeaders,
      });
    }

    if (
      cacheOptions.lastModified &&
      !ifNoneMatch &&
      isNotModifiedSince(ifModifiedSince, stats.mtime)
    ) {
      return new Response(null, {
        status: 304,
        headers: cacheHeaders,
      });
    }

    // Get MIME type
    const contentType = getMimeType(filePath, customMimeTypes);

    // Read file using Bun.file for optimal performance
    const file = Bun.file(filePath);

    // For HEAD requests, return headers only
    if (method === 'HEAD') {
      return new Response(null, {
        status: 200,
        headers: {
          ...cacheHeaders,
          'Content-Type': contentType,
          'Content-Length': stats.size.toString(),
        },
      });
    }

    // Return file response
    return new Response(file, {
      status: 200,
      headers: {
        ...cacheHeaders,
        'Content-Type': contentType,
        'Content-Length': stats.size.toString(),
      },
    });
  } catch (error) {
    // File doesn't exist or can't be read
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return null;
    }
    // Other errors (permission denied, etc.)
    throw error;
  }
}
