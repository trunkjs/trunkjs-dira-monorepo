import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { DiraCore } from '@dira/dira-core';
import { HonoAdapter } from '@dira/adapter-hono';
import { MethodsController } from './methods-controller';

describe('MethodsController', () => {
  const PORT = 3025;
  const BASE_URL = `http://localhost:${PORT}`;
  let adapter: HonoAdapter;

  beforeAll(async () => {
    const dira = new DiraCore();
    dira.registerController(new MethodsController());

    adapter = new HonoAdapter();
    await adapter.start(dira['routes'], { port: PORT });
  });

  afterAll(() => {
    adapter.stop();
  });

  describe('single method binding', () => {
    test('GET-only responds to GET', async () => {
      const response = await fetch(`${BASE_URL}/methods/get-only`);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ method: 'GET' });
    });

    test('GET-only rejects POST with 405 and Allow header', async () => {
      const response = await fetch(`${BASE_URL}/methods/get-only`, {
        method: 'POST',
      });
      expect(response.status).toBe(405);
      expect(response.headers.get('Allow')).toBe('GET');
    });

    test('POST-only responds to POST', async () => {
      const response = await fetch(`${BASE_URL}/methods/post-only`, {
        method: 'POST',
      });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ method: 'POST' });
    });

    test('POST-only rejects GET', async () => {
      const response = await fetch(`${BASE_URL}/methods/post-only`);
      expect(response.status).toBe(405);
    });
  });

  describe('multiple method binding', () => {
    test('responds to GET', async () => {
      const response = await fetch(`${BASE_URL}/methods/multiple`);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ method: 'GET' });
    });

    test('responds to POST', async () => {
      const response = await fetch(`${BASE_URL}/methods/multiple`, {
        method: 'POST',
      });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ method: 'POST' });
    });

    test('responds to PUT', async () => {
      const response = await fetch(`${BASE_URL}/methods/multiple`, {
        method: 'PUT',
      });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ method: 'PUT' });
    });

    test('rejects DELETE with 405 and Allow header listing all methods', async () => {
      const response = await fetch(`${BASE_URL}/methods/multiple`, {
        method: 'DELETE',
      });
      expect(response.status).toBe(405);
      expect(response.headers.get('Allow')).toBe('GET, POST, PUT');
    });
  });

  describe('handler() with method binding', () => {
    test('DELETE handler responds to DELETE', async () => {
      const response = await fetch(`${BASE_URL}/methods/item-123/delete`, {
        method: 'DELETE',
      });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        deleted: 'item-123',
        method: 'DELETE',
      });
    });

    test('DELETE handler rejects GET', async () => {
      const response = await fetch(`${BASE_URL}/methods/item-123/delete`);
      expect(response.status).toBe(405);
    });
  });
});
