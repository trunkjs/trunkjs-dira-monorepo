import type { CacheOptions } from './serve-static-options';

/** Result of building cache headers. */
export interface CacheHeadersResult {
  headers: Record<string, string>;
  etag?: string;
}

/**
 * Build cache-related headers for a static file response.
 *
 * @param mtime - File modification time as Date
 * @param size - File size in bytes
 * @param options - Cache configuration options
 * @param generateEtagFn - Function to generate ETag (injected for testability)
 * @returns Headers to set on the response and the generated ETag
 */
export function buildCacheHeaders(
  mtime: Date,
  size: number,
  options: CacheOptions,
  generateEtagFn: (mtime: number, size: number) => string,
): CacheHeadersResult {
  const headers: Record<string, string> = {};
  let etag: string | undefined;

  // Cache-Control header
  if (options.maxAge !== undefined && options.maxAge > 0) {
    headers['Cache-Control'] = `public, max-age=${options.maxAge}`;
  } else if (options.maxAge === 0) {
    headers['Cache-Control'] = 'no-cache';
  }

  // Last-Modified header
  if (options.lastModified !== false) {
    headers['Last-Modified'] = mtime.toUTCString();
  }

  // ETag header
  if (options.etag !== false) {
    etag = generateEtagFn(mtime.getTime(), size);
    headers['ETag'] = etag;
  }

  return { headers, etag };
}

/**
 * Check if the file has been modified since the client's cached version.
 *
 * @param ifModifiedSince - Value of If-Modified-Since header
 * @param mtime - File modification time
 * @returns true if the file has NOT been modified (304 should be returned)
 */
export function isNotModifiedSince(
  ifModifiedSince: string | null,
  mtime: Date,
): boolean {
  if (!ifModifiedSince) {
    return false;
  }

  const clientTime = new Date(ifModifiedSince);
  if (isNaN(clientTime.getTime())) {
    return false;
  }

  // Compare at second precision (HTTP dates don't have milliseconds)
  return (
    Math.floor(mtime.getTime() / 1000) <=
    Math.floor(clientTime.getTime() / 1000)
  );
}
