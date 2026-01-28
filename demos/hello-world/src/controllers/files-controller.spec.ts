import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { DiraCore } from '@dira/dira-core';
import { HonoAdapter } from '@dira/adapter-hono';
import { FilesController } from './files-controller';

describe('FilesController', () => {
  const PORT = 3026;
  const BASE_URL = `http://localhost:${PORT}`;
  let adapter: HonoAdapter;

  beforeAll(async () => {
    const dira = new DiraCore();
    dira.registerController(new FilesController());

    adapter = new HonoAdapter();
    await adapter.start(dira['routes'], { port: PORT });
  });

  afterAll(() => {
    adapter.stop();
  });

  test('captures single segment wildcard', async () => {
    const res = await fetch(`${BASE_URL}/files/readme.txt`);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ filePath: 'readme.txt' });
  });

  test('captures multi-segment wildcard path', async () => {
    const res = await fetch(`${BASE_URL}/files/path/to/file.txt`);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ filePath: 'path/to/file.txt' });
  });

  test('captures deeply nested wildcard path', async () => {
    const res = await fetch(`${BASE_URL}/files/a/b/c/d/e/f.txt`);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ filePath: 'a/b/c/d/e/f.txt' });
  });

  test('decodes URL-encoded path segments', async () => {
    const res = await fetch(`${BASE_URL}/files/my%20folder/my%20file.txt`);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ filePath: 'my folder/my file.txt' });
  });
});
