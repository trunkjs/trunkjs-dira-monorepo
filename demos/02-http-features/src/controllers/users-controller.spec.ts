import { describe, expect, it, afterEach } from 'bun:test';
import { DiraCore } from '@dira/core';
import { HonoAdapter } from '@dira/adapter-hono';
import { UsersController } from './users-controller';

describe('UsersController', () => {
  let adapter: HonoAdapter;

  afterEach(() => {
    adapter?.stop();
  });

  it('GET /users/:id returns user with path param', async () => {
    const dira = new DiraCore();
    dira.registerController(new UsersController());
    adapter = new HonoAdapter();
    await dira.run(adapter, { port: 0 });

    const response = await fetch(
      `http://${adapter.hostname}:${adapter.port}/users/123`,
    );
    expect(response.status).toBe(200);

    const body = (await response.json()) as Record<string, unknown>;
    expect(body).toEqual({
      userId: '123',
      name: 'User 123',
    });
  });

  it('GET /users/:userId/posts/:postId returns multiple params', async () => {
    const dira = new DiraCore();
    dira.registerController(new UsersController());
    adapter = new HonoAdapter();
    await dira.run(adapter, { port: 0 });

    const response = await fetch(
      `http://${adapter.hostname}:${adapter.port}/users/42/posts/99`,
    );
    expect(response.status).toBe(200);

    const body = (await response.json()) as Record<string, unknown>;
    expect(body).toEqual({
      userId: '42',
      postId: '99',
      title: 'Post 99 by User 42',
    });
  });
});
