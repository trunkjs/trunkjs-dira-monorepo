import { describe, expect, test } from 'bun:test';
import { extractPathParams } from './extract-path-params';

describe('extractPathParams', () => {
  test('extracts single parameter', () => {
    const params = extractPathParams(
      '/users/:id',
      'http://localhost/users/123',
    );

    expect(params).toEqual({ id: '123' });
  });

  test('extracts multiple parameters', () => {
    const params = extractPathParams(
      '/users/:userId/posts/:postId',
      'http://localhost/users/42/posts/99',
    );

    expect(params).toEqual({ userId: '42', postId: '99' });
  });

  test('handles route with no parameters', () => {
    const params = extractPathParams('/users', 'http://localhost/users');

    expect(params).toEqual({});
  });

  test('decodes URL-encoded parameter values', () => {
    const params = extractPathParams(
      '/search/:query',
      'http://localhost/search/hello%20world',
    );

    expect(params).toEqual({ query: 'hello world' });
  });

  test('handles parameter at the end of route', () => {
    const params = extractPathParams(
      '/api/v1/:version',
      'http://localhost/api/v1/2.0',
    );

    expect(params).toEqual({ version: '2.0' });
  });

  test('handles parameter in the middle of route', () => {
    const params = extractPathParams(
      '/api/:version/users',
      'http://localhost/api/v2/users',
    );

    expect(params).toEqual({ version: 'v2' });
  });

  test('handles URLs with query strings', () => {
    const params = extractPathParams(
      '/users/:id',
      'http://localhost/users/123?sort=name',
    );

    expect(params).toEqual({ id: '123' });
  });

  test('handles multiple consecutive parameters', () => {
    const params = extractPathParams(
      '/:a/:b/:c',
      'http://localhost/one/two/three',
    );

    expect(params).toEqual({ a: 'one', b: 'two', c: 'three' });
  });
});
