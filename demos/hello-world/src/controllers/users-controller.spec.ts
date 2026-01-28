import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { DiraCore } from '@dira/dira-core';
import { HonoAdapter } from '@dira/adapter-hono';
import { UsersController } from './users-controller';

describe('UsersController', () => {
  const PORT = 3019;
  const BASE_URL = `http://localhost:${PORT}`;
  let adapter: HonoAdapter;

  beforeAll(async () => {
    const dira = new DiraCore();
    dira.registerController(new UsersController());

    adapter = new HonoAdapter();
    await adapter.start(dira['routes'], { port: PORT });
  });

  afterAll(() => {
    adapter.stop();
  });

  test('extracts single path parameter', async () => {
    const response = await fetch(`${BASE_URL}/users/123`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/json');
    expect(await response.json()).toEqual({ userId: '123' });
  });

  test('extracts multiple path parameters', async () => {
    const response = await fetch(`${BASE_URL}/users/42/posts/99`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ userId: '42', postId: '99' });
  });

  test('handles path param with additional segments', async () => {
    const response = await fetch(`${BASE_URL}/users/abc/profile`);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.userId).toBe('abc');
    expect(data.profile).toEqual({
      name: 'Test User',
      email: 'test@example.com',
    });
  });

  test('handles URL-encoded path parameters', async () => {
    const response = await fetch(`${BASE_URL}/users/hello%20world`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ userId: 'hello world' });
  });
});
