import { describe, expect, test } from 'bun:test';
import { convertRouteForAdapter } from './convert-route-for-adapter';

describe('convertRouteForAdapter', () => {
  test('returns route unchanged when no wildcard', () => {
    expect(convertRouteForAdapter('/users')).toBe('/users');
    expect(convertRouteForAdapter('/users/:id')).toBe('/users/:id');
    expect(convertRouteForAdapter('/users/:id/posts/:postId')).toBe(
      '/users/:id/posts/:postId',
    );
  });

  test('converts wildcard param to asterisk', () => {
    expect(convertRouteForAdapter('/files/::path')).toBe('/files/*');
    expect(convertRouteForAdapter('/api/:version/files/::path')).toBe(
      '/api/:version/files/*',
    );
  });

  test('only converts wildcard at end', () => {
    // The regex uses $ anchor, so it only matches at end
    expect(convertRouteForAdapter('/::path')).toBe('/*');
  });
});
