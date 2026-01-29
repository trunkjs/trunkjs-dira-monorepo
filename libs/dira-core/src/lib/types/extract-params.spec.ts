import { describe, expect, test } from 'bun:test';
import type { ExtractParams } from './extract-params';

describe('ExtractParams type', () => {
  test('extracts single parameter', () => {
    type Result = ExtractParams<'/users/:id'>;
    const params: Result = { id: 'test' };
    expect(params.id).toBe('test');
  });

  test('extracts multiple parameters', () => {
    type Result = ExtractParams<'/users/:userId/posts/:postId'>;
    const params: Result = { userId: 'u1', postId: 'p1' };
    expect(params.userId).toBe('u1');
    expect(params.postId).toBe('p1');
  });

  test('returns empty object for route without parameters', () => {
    type Result = ExtractParams<'/users'>;
    const params: Result = {};
    expect(Object.keys(params)).toHaveLength(0);
  });

  test('handles parameter at end of route', () => {
    type Result = ExtractParams<'/api/:version'>;
    const params: Result = { version: 'v1' };
    expect(params.version).toBe('v1');
  });

  test('handles parameter in middle of route', () => {
    type Result = ExtractParams<'/api/:version/users'>;
    const params: Result = { version: 'v2' };
    expect(params.version).toBe('v2');
  });

  test('handles three consecutive parameters', () => {
    type Result = ExtractParams<'/:a/:b/:c'>;
    const params: Result = { a: '1', b: '2', c: '3' };
    expect(params.a).toBe('1');
    expect(params.b).toBe('2');
    expect(params.c).toBe('3');
  });

  test('extracts wildcard parameter', () => {
    type Result = ExtractParams<'/files/::path'>;
    const params: Result = { path: 'some/file/path.txt' };
    expect(params.path).toBe('some/file/path.txt');
  });

  test('extracts both regular and wildcard parameters', () => {
    type Result = ExtractParams<'/buckets/:bucket/files/::path'>;
    const params: Result = { bucket: 'my-bucket', path: 'docs/readme.md' };
    expect(params.bucket).toBe('my-bucket');
    expect(params.path).toBe('docs/readme.md');
  });
});
