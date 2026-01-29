import { describe, expect, it, afterEach } from 'bun:test';
import { DiraCore } from '@dira/core';
import { HonoAdapter } from '@dira/adapter-hono';
import { ResponsesController } from './responses-controller';

describe('ResponsesController', () => {
  let adapter: HonoAdapter;

  afterEach(() => {
    adapter?.stop();
  });

  it('returns object as JSON', async () => {
    const dira = new DiraCore();
    dira.registerController(new ResponsesController());
    adapter = new HonoAdapter();
    await dira.run(adapter, { port: 0 });

    const response = await fetch(
      `http://${adapter.hostname}:${adapter.port}/responses/object`,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const body = (await response.json()) as Record<string, unknown>;
    expect(body).toEqual({ type: 'object', data: [1, 2, 3] });
  });

  it('returns array as JSON', async () => {
    const dira = new DiraCore();
    dira.registerController(new ResponsesController());
    adapter = new HonoAdapter();
    await dira.run(adapter, { port: 0 });

    const response = await fetch(
      `http://${adapter.hostname}:${adapter.port}/responses/array`,
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as string[];
    expect(body).toEqual(['item1', 'item2', 'item3']);
  });

  it('returns string as JSON', async () => {
    const dira = new DiraCore();
    dira.registerController(new ResponsesController());
    adapter = new HonoAdapter();
    await dira.run(adapter, { port: 0 });

    const response = await fetch(
      `http://${adapter.hostname}:${adapter.port}/responses/string`,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const body = (await response.json()) as string;
    expect(body).toBe('Hello, World!');
  });

  it('returns number as JSON', async () => {
    const dira = new DiraCore();
    dira.registerController(new ResponsesController());
    adapter = new HonoAdapter();
    await dira.run(adapter, { port: 0 });

    const response = await fetch(
      `http://${adapter.hostname}:${adapter.port}/responses/number`,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const body = (await response.json()) as number;
    expect(body).toBe(42);
  });

  it('returns boolean as JSON', async () => {
    const dira = new DiraCore();
    dira.registerController(new ResponsesController());
    adapter = new HonoAdapter();
    await dira.run(adapter, { port: 0 });

    const response = await fetch(
      `http://${adapter.hostname}:${adapter.port}/responses/boolean`,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const body = (await response.json()) as boolean;
    expect(body).toBe(true);
  });

  it('returns null as 204 No Content', async () => {
    const dira = new DiraCore();
    dira.registerController(new ResponsesController());
    adapter = new HonoAdapter();
    await dira.run(adapter, { port: 0 });

    const response = await fetch(
      `http://${adapter.hostname}:${adapter.port}/responses/null`,
    );
    expect(response.status).toBe(204);
  });

  it('returns void as 204 No Content', async () => {
    const dira = new DiraCore();
    dira.registerController(new ResponsesController());
    adapter = new HonoAdapter();
    await dira.run(adapter, { port: 0 });

    const response = await fetch(
      `http://${adapter.hostname}:${adapter.port}/responses/void`,
    );
    expect(response.status).toBe(204);
  });

  it('returns custom Response with status and headers', async () => {
    const dira = new DiraCore();
    dira.registerController(new ResponsesController());
    adapter = new HonoAdapter();
    await dira.run(adapter, { port: 0 });

    const response = await fetch(
      `http://${adapter.hostname}:${adapter.port}/responses/custom`,
    );
    expect(response.status).toBe(201);
    expect(response.headers.get('X-Custom-Header')).toBe('custom-value');
    const body = (await response.json()) as { custom: boolean };
    expect(body).toEqual({ custom: true });
  });

  it('returns redirect response', async () => {
    const dira = new DiraCore();
    dira.registerController(new ResponsesController());
    adapter = new HonoAdapter();
    await dira.run(adapter, { port: 0 });

    const response = await fetch(
      `http://${adapter.hostname}:${adapter.port}/responses/redirect`,
      { redirect: 'manual' },
    );
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/responses/object');
  });
});
