import { describe, expect, it } from 'bun:test';
import { generateEtag, isEtagMatch } from './etag';

describe('generateEtag', () => {
  it('generates weak ETag format', () => {
    const etag = generateEtag(1704067200000, 1024);
    expect(etag).toMatch(/^W\/"[0-9a-f]+-[0-9a-f]+"$/);
  });

  it('encodes mtime and size in hex', () => {
    // 1704067200000 in hex = 18cc251f400, 1024 in hex = 400
    const etag = generateEtag(1704067200000, 1024);
    expect(etag).toBe(`W/"${(1704067200000).toString(16)}-400"`);
  });

  it('truncates fractional milliseconds', () => {
    const etag1 = generateEtag(1704067200000.5, 1024);
    const etag2 = generateEtag(1704067200000, 1024);
    expect(etag1).toBe(etag2);
  });

  it('handles zero size', () => {
    const etag = generateEtag(1704067200000, 0);
    expect(etag).toBe(`W/"${(1704067200000).toString(16)}-0"`);
  });
});

describe('isEtagMatch', () => {
  const currentEtag = 'W/"18c64a4cc00-400"';

  it('returns false for null header', () => {
    expect(isEtagMatch(null, currentEtag)).toBe(false);
  });

  it('matches exact ETag', () => {
    expect(isEtagMatch('W/"18c64a4cc00-400"', currentEtag)).toBe(true);
  });

  it('matches wildcard', () => {
    expect(isEtagMatch('*', currentEtag)).toBe(true);
  });

  it('matches wildcard with whitespace', () => {
    expect(isEtagMatch('  *  ', currentEtag)).toBe(true);
  });

  it('matches in comma-separated list', () => {
    expect(
      isEtagMatch('W/"abc-123", W/"18c64a4cc00-400", W/"def-456"', currentEtag),
    ).toBe(true);
  });

  it('ignores weak prefix for comparison', () => {
    // Weak and strong ETags with same value should match
    expect(isEtagMatch('"18c64a4cc00-400"', currentEtag)).toBe(true);
  });

  it('returns false for non-matching ETag', () => {
    expect(isEtagMatch('W/"different-etag"', currentEtag)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isEtagMatch('', currentEtag)).toBe(false);
  });

  it('handles ETags with extra whitespace', () => {
    expect(isEtagMatch('  W/"18c64a4cc00-400"  ', currentEtag)).toBe(true);
  });
});
