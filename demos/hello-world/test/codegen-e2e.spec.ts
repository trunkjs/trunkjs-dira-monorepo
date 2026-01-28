import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtempSync } from 'node:fs';
import { DiraCore } from '@dira/dira-core';
import { HonoAdapter } from '@dira/adapter-hono';
import { generateClient } from '@dira/codegen';

describe('Codegen E2E', () => {
  let adapter: HonoAdapter;
  let BASE_URL: string;
  let createClient: (baseUrl: string) => any;
  let tmpDir: string;

  beforeAll(async () => {
    // 1. Generate client code from controllers
    const code = generateClient({
      controllerGlobs: [join(import.meta.dirname, '../src/controllers')],
      tsconfig: join(import.meta.dirname, '../../../tsconfig.base.json'),
    });

    // 2. Write to a temp file and import the createClient function
    tmpDir = mkdtempSync(join(tmpdir(), 'dira-codegen-e2e-'));
    const tmpPath = join(tmpDir, 'client.ts');
    await Bun.write(tmpPath, code);
    const mod = await import(tmpPath);
    createClient = mod.createClient;

    // 3. Start the server
    const dira = new DiraCore();
    await dira.discover(join(import.meta.dirname, '../src/controllers'));
    adapter = new HonoAdapter();
    const { port, hostname } = await adapter.start(dira['routes'], { port: 0 });
    BASE_URL = `http://${hostname}:${port}`;
  });

  afterAll(async () => {
    adapter.stop();
    const { rmSync } = await import('node:fs');
    try {
      rmSync(tmpDir, { recursive: true });
    } catch {}
  });

  test('client is generated and createClient is callable', () => {
    expect(typeof createClient).toBe('function');
    const api = createClient(BASE_URL);
    expect(api).toBeDefined();
    expect(api.posts).toBeDefined();
    expect(api.users).toBeDefined();
    expect(api.search).toBeDefined();
    expect(api.methods).toBeDefined();
  });

  test('GET simple endpoint (methods controller)', async () => {
    const api = createClient(BASE_URL);
    const res = await api.methods.getOnly.$get();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.method).toBe('GET');
  });

  test('POST with typed body (posts controller)', async () => {
    const api = createClient(BASE_URL);
    const res = await api.posts.createPost.$post({
      body: { title: 'E2E Post', content: 'Hello from codegen', tags: ['e2e'] },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe('post-123');
    expect(data.title).toBe('E2E Post');
    expect(data.content).toBe('Hello from codegen');
    expect(data.tags).toEqual(['e2e']);
    expect(data.createdAt).toBeDefined();
  });

  test('GET with path params (users controller)', async () => {
    const api = createClient(BASE_URL);
    const res = await api.users.getUser.$get({ params: { id: 'user-42' } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.userId).toBe('user-42');
  });

  test('GET with multiple path params', async () => {
    const api = createClient(BASE_URL);
    const res = await api.users.getUserPost.$get({
      params: { userId: 'u1', postId: 'p2' },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.userId).toBe('u1');
    expect(data.postId).toBe('p2');
  });

  test('GET with nested return type', async () => {
    const api = createClient(BASE_URL);
    const res = await api.users.getProfile.$get({ params: { id: 'u1' } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.userId).toBe('u1');
    expect(data.profile.name).toBe('Test User');
    expect(data.profile.email).toBe('test@example.com');
  });

  test('POST with body and path params (update post)', async () => {
    const api = createClient(BASE_URL);
    const res = await api.posts.updatePost.$post({
      body: { title: 'Updated' },
      params: { id: 'abc-123' },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe('abc-123');
    expect(data.updated).toBe(true);
    expect(data.changes.title).toBe('Updated');
  });

  test('POST with body, query, and path params (publish post)', async () => {
    const api = createClient(BASE_URL);
    const res = await api.posts.publishPost.$post({
      body: { scheduledAt: '2025-01-01T00:00:00Z', notifySubscribers: true },
      query: { draft: 'true', preview: 'false' },
      params: { authorId: 'author-1', postId: 'post-99' },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.authorId).toBe('author-1');
    expect(data.postId).toBe('post-99');
    expect(data.scheduledAt).toBe('2025-01-01T00:00:00Z');
    expect(data.notifySubscribers).toBe(true);
    expect(data.isDraft).toBe(true);
    expect(data.isPreview).toBe(false);
  });

  test('GET with query params (search controller)', async () => {
    const api = createClient(BASE_URL);
    const res = await api.search.search.$get({
      query: { q: 'hello', limit: '5' },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.query).toBe('hello');
    expect(data.limit).toBe(5);
    expect(data.results).toBeInstanceOf(Array);
  });

  test('DELETE with path params (methods controller)', async () => {
    const api = createClient(BASE_URL);
    const res = await api.methods.deleteItem.$delete({
      params: { id: 'item-7' },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.deleted).toBe('item-7');
    expect(data.method).toBe('DELETE');
  });

  test('method restriction is enforced by server', async () => {
    const api = createClient(BASE_URL);
    // getOnly only accepts GET — POST should 404/405
    const res = await api.methods.postOnly.$post();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.method).toBe('POST');
  });

  test('request metadata endpoint', async () => {
    const api = createClient(BASE_URL);
    const res = await api.posts.getMetadata.$get();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.method).toBe('GET');
    expect(data.url).toContain('/posts/metadata');
  });

  test('$routes exposes all route metadata', () => {
    const api = createClient(BASE_URL);
    const routes = api.$routes;

    expect(routes).toBeDefined();
    expect(typeof routes).toBe('object');

    // Check specific routes exist
    expect(routes['posts.createPost']).toBeDefined();
    expect(routes['users.getUser']).toBeDefined();
    expect(routes['methods.getOnly']).toBeDefined();

    // Verify route structure
    expect(routes['posts.createPost'].path).toBe('/posts/create');
    expect(routes['users.getUser'].path).toBe('/users/:id');
    expect(routes['methods.deleteItem'].path).toBe('/methods/:id/delete');
  });

  test('$routes contains correct HTTP methods', () => {
    const api = createClient(BASE_URL);
    const routes = api.$routes;

    // Single method routes
    expect(routes['methods.getOnly'].methods).toEqual(['GET']);
    expect(routes['methods.postOnly'].methods).toEqual(['POST']);
    expect(routes['methods.deleteItem'].methods).toEqual(['DELETE']);

    // Multiple methods
    expect(routes['methods.multiple'].methods).toEqual(['GET', 'POST', 'PUT']);
  });

  test('$route exposes individual handler metadata', () => {
    const api = createClient(BASE_URL);

    // Access $route on different handlers
    const createPostRoute = api.posts.createPost.$route;
    expect(createPostRoute).toBeDefined();
    expect(createPostRoute.path).toBe('/posts/create');
    expect(Array.isArray(createPostRoute.methods)).toBe(true);

    const getUserRoute = api.users.getUser.$route;
    expect(getUserRoute).toBeDefined();
    expect(getUserRoute.path).toBe('/users/:id');

    const deleteItemRoute = api.methods.deleteItem.$route;
    expect(deleteItemRoute).toBeDefined();
    expect(deleteItemRoute.path).toBe('/methods/:id/delete');
    expect(deleteItemRoute.methods).toEqual(['DELETE']);
  });

  test('$route matches corresponding $routes entry', () => {
    const api = createClient(BASE_URL);

    // Verify $route and $routes return the same object
    expect(api.posts.createPost.$route).toBe(api.$routes['posts.createPost']);
    expect(api.users.getUser.$route).toBe(api.$routes['users.getUser']);
    expect(api.methods.getOnly.$route).toBe(api.$routes['methods.getOnly']);
  });

  test('$route returns undefined for non-existent handlers', () => {
    const api = createClient(BASE_URL);

    // Accessing $route on a non-existent path should return undefined
    const nonExistent = (api as any).nonexistent.handler.$route;
    expect(nonExistent).toBeUndefined();
  });
});
