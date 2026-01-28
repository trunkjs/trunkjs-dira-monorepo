import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtempSync } from 'node:fs';
import { DiraCore } from '@dira/dira-core';
import { HonoAdapter } from '@dira/adapter-hono';
import { generateClient } from '@dira/codegen';

describe('Codegen E2E', () => {
  const PORT = 3030;
  const BASE_URL = `http://localhost:${PORT}`;
  let adapter: HonoAdapter;
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
    await adapter.start(dira['routes'], { port: PORT });
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
});
