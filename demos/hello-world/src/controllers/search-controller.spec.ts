import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { DiraCore } from '@dira/dira-core';
import { HonoAdapter } from '@dira/adapter-hono';
import { SearchController } from './search-controller';

describe('SearchController', () => {
  let adapter: HonoAdapter;
  let BASE_URL: string;

  beforeAll(async () => {
    const dira = new DiraCore();
    dira.registerController(new SearchController());

    adapter = new HonoAdapter();
    const { port, hostname } = await adapter.start(dira['routes'], { port: 0 });
    BASE_URL = `http://${hostname}:${port}`;
  });

  afterAll(() => {
    adapter.stop();
  });

  test('parses query parameters', async () => {
    const response = await fetch(
      `${BASE_URL}/search/?q=test&limit=5&offset=10`,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      query: 'test',
      limit: 5,
      offset: 10,
      results: ['Result for "test"'],
    });
  });

  test('uses default values for missing query params', async () => {
    const response = await fetch(`${BASE_URL}/search/?q=hello`);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.query).toBe('hello');
    expect(data.limit).toBe(10);
    expect(data.offset).toBe(0);
  });

  test('handles empty query string', async () => {
    const response = await fetch(`${BASE_URL}/search/`);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.query).toBe('');
  });

  test('handles repeated query parameters as array', async () => {
    const response = await fetch(
      `${BASE_URL}/search/filter?tag=javascript&tag=typescript&tag=bun`,
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.tags).toEqual(['javascript', 'typescript', 'bun']);
  });

  test('handles single value that could be array', async () => {
    const response = await fetch(`${BASE_URL}/search/filter?tag=single`);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.tags).toBe('single');
  });

  test('handles mixed query parameters', async () => {
    const response = await fetch(
      `${BASE_URL}/search/filter?category=tech&tag=js&sort=date`,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      category: 'tech',
      tags: 'js',
      sort: 'date',
    });
  });

  test('exposes raw query object', async () => {
    const response = await fetch(`${BASE_URL}/search/raw-query?a=1&b=2&c=3`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      query: { a: '1', b: '2', c: '3' },
    });
  });
});
