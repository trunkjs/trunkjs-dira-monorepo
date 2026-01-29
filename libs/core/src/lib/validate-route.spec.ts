import { describe, expect, test } from 'bun:test';
import { validateRoute } from './validate-route';

describe('validateRoute', () => {
  test('allows regular route without params', () => {
    expect(() => validateRoute('/users')).not.toThrow();
  });

  test('allows route with regular params', () => {
    expect(() => validateRoute('/users/:id')).not.toThrow();
    expect(() => validateRoute('/users/:id/posts/:postId')).not.toThrow();
  });

  test('allows route with wildcard param at end', () => {
    expect(() => validateRoute('/files/::path')).not.toThrow();
    expect(() => validateRoute('/api/:version/files/::path')).not.toThrow();
  });

  test('throws if wildcard param is not at end', () => {
    expect(() => validateRoute('/files/::path/download')).toThrow(
      'wildcard parameter "::path" must be at the end of the route',
    );
  });

  test('throws if multiple wildcard params', () => {
    expect(() => validateRoute('/files/::path/::other')).toThrow(
      'must be at the end of the route',
    );
  });

  test('throws if wildcard param has no name', () => {
    expect(() => validateRoute('/files/::')).toThrow(
      'wildcard parameter must have a name',
    );
  });
});
