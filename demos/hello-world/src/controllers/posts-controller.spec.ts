import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { DiraCore } from '@dira/dira-core';
import { HonoAdapter } from '@dira/adapter-hono';
import { PostsController } from './posts-controller';

describe('PostsController', () => {
  const PORT = 3021;
  const BASE_URL = `http://localhost:${PORT}`;
  let adapter: HonoAdapter;

  beforeAll(async () => {
    const dira = new DiraCore();
    dira.registerController(new PostsController());

    adapter = new HonoAdapter();
    await adapter.start(dira['routes'], { port: PORT });
  });

  afterAll(() => {
    adapter.stop();
  });

  test('parses JSON request body', async () => {
    const response = await fetch(`${BASE_URL}/posts/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'My Post',
        content: 'Hello world',
        tags: ['test', 'demo'],
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe('post-123');
    expect(data.title).toBe('My Post');
    expect(data.content).toBe('Hello world');
    expect(data.tags).toEqual(['test', 'demo']);
    expect(data.createdAt).toBeDefined();
  });

  test('handles JSON body with path params', async () => {
    const response = await fetch(`${BASE_URL}/posts/abc-456/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated Title' }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: 'abc-456',
      updated: true,
      changes: { title: 'Updated Title' },
    });
  });

  test('parses text request body', async () => {
    const response = await fetch(`${BASE_URL}/posts/from-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'This is plain text content',
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      receivedText: 'This is plain text content',
      length: 26,
    });
  });

  test('parses form data request body', async () => {
    const formData = new FormData();
    formData.append('title', 'Form Post');
    formData.append('content', 'Content from form');

    const response = await fetch(`${BASE_URL}/posts/from-form`, {
      method: 'POST',
      body: formData,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      title: 'Form Post',
      content: 'Content from form',
    });
  });

  test('provides access to request metadata', async () => {
    const response = await fetch(`${BASE_URL}/posts/metadata`, {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.method).toBe('GET');
    expect(data.url).toContain('/posts/metadata');
  });

  test('provides raw request access via metadata', async () => {
    const response = await fetch(`${BASE_URL}/posts/metadata`, {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.method).toBe('GET');
  });

  test('handles path params, query params, and body together', async () => {
    const response = await fetch(
      `${BASE_URL}/posts/user-42/posts/post-99/publish?draft=true&preview=false`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledAt: '2024-12-25T10:00:00Z',
          notifySubscribers: true,
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      authorId: 'user-42',
      postId: 'post-99',
      scheduledAt: '2024-12-25T10:00:00Z',
      notifySubscribers: true,
      isDraft: true,
      isPreview: false,
    });
  });

  test('handles missing optional query params', async () => {
    const response = await fetch(
      `${BASE_URL}/posts/author-1/posts/post-1/publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notifySubscribers: false,
        }),
      },
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.authorId).toBe('author-1');
    expect(data.postId).toBe('post-1');
    expect(data.scheduledAt).toBeNull();
    expect(data.notifySubscribers).toBe(false);
    expect(data.isDraft).toBe(false);
    expect(data.isPreview).toBe(false);
  });
});
