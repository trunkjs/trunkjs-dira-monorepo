import { describe, expect, it } from 'bun:test';
import { buildCacheHeaders, isNotModifiedSince } from './cache-headers';

describe('buildCacheHeaders', () => {
  const mockGenerateEtag = (mtime: number, size: number) =>
    `W/"${mtime.toString(16)}-${size.toString(16)}"`;
  const mtime = new Date('2024-01-01T00:00:00Z');
  const size = 1024;

  it('includes all headers with default options', () => {
    const result = buildCacheHeaders(
      mtime,
      size,
      { etag: true, lastModified: true },
      mockGenerateEtag,
    );

    expect(result.headers['Last-Modified']).toBe(mtime.toUTCString());
    expect(result.headers['ETag']).toBeDefined();
    expect(result.etag).toBeDefined();
  });

  it('sets Cache-Control with maxAge', () => {
    const result = buildCacheHeaders(
      mtime,
      size,
      { maxAge: 3600 },
      mockGenerateEtag,
    );
    expect(result.headers['Cache-Control']).toBe('public, max-age=3600');
  });

  it('sets no-cache when maxAge is 0', () => {
    const result = buildCacheHeaders(
      mtime,
      size,
      { maxAge: 0 },
      mockGenerateEtag,
    );
    expect(result.headers['Cache-Control']).toBe('no-cache');
  });

  it('omits Cache-Control when maxAge is undefined', () => {
    const result = buildCacheHeaders(mtime, size, {}, mockGenerateEtag);
    expect(result.headers['Cache-Control']).toBeUndefined();
  });

  it('omits Last-Modified when disabled', () => {
    const result = buildCacheHeaders(
      mtime,
      size,
      { lastModified: false },
      mockGenerateEtag,
    );
    expect(result.headers['Last-Modified']).toBeUndefined();
  });

  it('omits ETag when disabled', () => {
    const result = buildCacheHeaders(
      mtime,
      size,
      { etag: false },
      mockGenerateEtag,
    );
    expect(result.headers['ETag']).toBeUndefined();
    expect(result.etag).toBeUndefined();
  });

  it('returns ETag in result for conditional checking', () => {
    const result = buildCacheHeaders(
      mtime,
      size,
      { etag: true },
      mockGenerateEtag,
    );
    expect(result.etag).toBe(result.headers['ETag']);
  });
});

describe('isNotModifiedSince', () => {
  const mtime = new Date('2024-01-01T12:00:00Z');

  it('returns false for null header', () => {
    expect(isNotModifiedSince(null, mtime)).toBe(false);
  });

  it('returns true when client date is same as mtime', () => {
    expect(isNotModifiedSince('Mon, 01 Jan 2024 12:00:00 GMT', mtime)).toBe(
      true,
    );
  });

  it('returns true when client date is after mtime', () => {
    expect(isNotModifiedSince('Mon, 01 Jan 2024 13:00:00 GMT', mtime)).toBe(
      true,
    );
  });

  it('returns false when client date is before mtime', () => {
    expect(isNotModifiedSince('Mon, 01 Jan 2024 11:00:00 GMT', mtime)).toBe(
      false,
    );
  });

  it('returns false for invalid date string', () => {
    expect(isNotModifiedSince('not-a-date', mtime)).toBe(false);
  });

  it('compares at second precision (ignores milliseconds)', () => {
    // mtime with 500ms
    const mtimeWithMs = new Date('2024-01-01T12:00:00.500Z');
    // Client date at same second but no milliseconds
    expect(
      isNotModifiedSince('Mon, 01 Jan 2024 12:00:00 GMT', mtimeWithMs),
    ).toBe(true);
  });
});
