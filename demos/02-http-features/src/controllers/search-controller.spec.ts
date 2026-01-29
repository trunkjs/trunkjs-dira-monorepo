import { describe, expect, it, afterEach } from 'bun:test';
import { DiraCore } from '@dira/core';
import { HonoAdapter } from '@dira/adapter-hono';
import { SearchController } from './search-controller';

describe('SearchController', () => {
  let adapter: HonoAdapter;

  afterEach(() => {
    adapter?.stop();
  });

  it('GET /search with query params', async () => {
    const dira = new DiraCore();
    dira.registerController(new SearchController());
    adapter = new HonoAdapter();
    await dira.run(adapter, { port: 0 });

    const response = await fetch(
      `http://${adapter.hostname}:${adapter.port}/search/?q=test&page=2&limit=5`,
    );
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      query: string;
      page: number;
      limit: number;
      results: string[];
    };
    expect(body.query).toBe('test');
    expect(body.page).toBe(2);
    expect(body.limit).toBe(5);
    expect(body.results).toHaveLength(5);
  });

  it('GET /search with defaults', async () => {
    const dira = new DiraCore();
    dira.registerController(new SearchController());
    adapter = new HonoAdapter();
    await dira.run(adapter, { port: 0 });

    const response = await fetch(
      `http://${adapter.hostname}:${adapter.port}/search/`,
    );
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      query: string;
      page: number;
      limit: number;
      results: string[];
    };
    expect(body.query).toBe('');
    expect(body.page).toBe(1);
    expect(body.limit).toBe(10);
    expect(body.results).toHaveLength(0);
  });

  it('GET /search/filter with tags and active flag', async () => {
    const dira = new DiraCore();
    dira.registerController(new SearchController());
    adapter = new HonoAdapter();
    await dira.run(adapter, { port: 0 });

    const response = await fetch(
      `http://${adapter.hostname}:${adapter.port}/search/filter?tags=a,b,c&active=true`,
    );
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      tags: string[];
      active: boolean;
      results: string[];
    };
    expect(body.tags).toEqual(['a', 'b', 'c']);
    expect(body.active).toBe(true);
    expect(body.results).toHaveLength(3);
    expect(body.results[0]).toContain('Active');
  });
});
