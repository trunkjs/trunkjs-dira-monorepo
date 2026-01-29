import { describe, expect, it, afterEach } from 'bun:test';
import { DiraCore } from '@dira/core';
import { HonoAdapter } from '@dira/adapter-hono';
import { PostsController } from './posts-controller';

describe('PostsController', () => {
  let adapter: HonoAdapter;

  afterEach(() => {
    adapter?.stop();
  });

  it('CRUD operations on posts', async () => {
    const dira = new DiraCore();
    dira.registerController(new PostsController());
    adapter = new HonoAdapter();
    await dira.run(adapter, { port: 0 });

    const baseUrl = `http://${adapter.hostname}:${adapter.port}/posts`;

    // Create a post (POST /posts/create)
    const createResponse = await fetch(`${baseUrl}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test Post', content: 'Test content' }),
    });
    expect(createResponse.status).toBe(200);
    const created = (await createResponse.json()) as {
      id: string;
      title: string;
      content: string;
    };
    expect(created.title).toBe('Test Post');
    expect(created.id).toBeDefined();

    // List posts (GET /posts/list)
    const listResponse = await fetch(`${baseUrl}/list`);
    const list = (await listResponse.json()) as {
      posts: { id: string; title: string; content: string }[];
    };
    expect(list.posts).toHaveLength(1);

    // Update the post (PUT /posts/update/:id)
    const updateResponse = await fetch(`${baseUrl}/update/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated Title' }),
    });
    expect(updateResponse.status).toBe(200);
    const updated = (await updateResponse.json()) as {
      title: string;
      content: string;
    };
    expect(updated.title).toBe('Updated Title');
    expect(updated.content).toBe('Test content');

    // Delete the post (DELETE /posts/delete/:id)
    const deleteResponse = await fetch(`${baseUrl}/delete/${created.id}`, {
      method: 'DELETE',
    });
    expect(deleteResponse.status).toBe(200);
    const deleted = (await deleteResponse.json()) as { deleted: boolean };
    expect(deleted.deleted).toBe(true);

    // Verify it's gone
    const finalList = await fetch(`${baseUrl}/list`);
    const finalListBody = (await finalList.json()) as {
      posts: { id: string; title: string; content: string }[];
    };
    expect(finalListBody.posts).toHaveLength(0);
  });

  it('PUT returns 404 for non-existent post', async () => {
    const dira = new DiraCore();
    dira.registerController(new PostsController());
    adapter = new HonoAdapter();
    await dira.run(adapter, { port: 0 });

    const response = await fetch(
      `http://${adapter.hostname}:${adapter.port}/posts/update/999`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Title' }),
      },
    );
    expect(response.status).toBe(404);
  });

  it('DELETE returns 404 for non-existent post', async () => {
    const dira = new DiraCore();
    dira.registerController(new PostsController());
    adapter = new HonoAdapter();
    await dira.run(adapter, { port: 0 });

    const response = await fetch(
      `http://${adapter.hostname}:${adapter.port}/posts/delete/999`,
      { method: 'DELETE' },
    );
    expect(response.status).toBe(404);
  });
});
