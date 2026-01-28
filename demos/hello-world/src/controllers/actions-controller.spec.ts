import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { DiraCore } from '@dira/dira-core';
import { HonoAdapter } from '@dira/adapter-hono';
import { ActionsController } from './actions-controller';

describe('ActionsController', () => {
  const PORT = 3022;
  const BASE_URL = `http://localhost:${PORT}`;
  let adapter: HonoAdapter;

  beforeAll(async () => {
    const dira = new DiraCore();
    dira.registerController(new ActionsController());

    adapter = new HonoAdapter();
    await adapter.start(dira['routes'], { port: PORT });
  });

  afterAll(() => {
    adapter.stop();
  });

  describe('204 No Content responses', () => {
    test('void return produces 204', async () => {
      const response = await fetch(`${BASE_URL}/actions/void`);

      expect(response.status).toBe(204);
      expect(await response.text()).toBe('');
    });

    test('null return produces 204', async () => {
      const response = await fetch(`${BASE_URL}/actions/null`);

      expect(response.status).toBe(204);
      expect(await response.text()).toBe('');
    });

    test('async void return produces 204', async () => {
      const response = await fetch(`${BASE_URL}/actions/async-void`);

      expect(response.status).toBe(204);
      expect(await response.text()).toBe('');
    });

    test('void actions still execute side effects', async () => {
      // Reset counter
      await fetch(`${BASE_URL}/actions/reset`);

      // Perform void actions
      await fetch(`${BASE_URL}/actions/void`);
      await fetch(`${BASE_URL}/actions/void`);
      await fetch(`${BASE_URL}/actions/null`);

      // Check counter was incremented
      const response = await fetch(`${BASE_URL}/actions/counter`);
      expect(await response.json()).toEqual({ counter: 3 });
    });
  });

  describe('Custom Response handling', () => {
    test('returns explicit Response with custom status', async () => {
      const response = await fetch(`${BASE_URL}/actions/custom-response`);

      expect(response.status).toBe(201);
      expect(response.headers.get('X-Custom-Header')).toBe('custom-value');
      expect(response.headers.get('Content-Type')).toBe('text/plain');
      expect(await response.text()).toBe('Custom response body');
    });
  });

  describe('Auto-wrapped JSON responses', () => {
    test('wraps object as JSON', async () => {
      const response = await fetch(`${BASE_URL}/actions/sync-object`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('application/json');
      expect(await response.json()).toEqual({ sync: true, type: 'object' });
    });

    test('wraps array as JSON', async () => {
      const response = await fetch(`${BASE_URL}/actions/sync-array`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('application/json');
      expect(await response.json()).toEqual([1, 2, 3, 'four', { five: 5 }]);
    });

    test('wraps number as JSON', async () => {
      const response = await fetch(`${BASE_URL}/actions/sync-number`);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(typeof data).toBe('number');
      expect(data).toBe(42);
    });

    test('wraps string as JSON', async () => {
      const response = await fetch(`${BASE_URL}/actions/sync-string`);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(typeof data).toBe('string');
      expect(data).toBe('just a string');
    });

    test('wraps boolean as JSON', async () => {
      const response = await fetch(`${BASE_URL}/actions/sync-boolean`);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(typeof data).toBe('boolean');
      expect(data).toBe(true);
    });

    test('wraps async data as JSON', async () => {
      const response = await fetch(`${BASE_URL}/actions/async-data`);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('application/json');
      const data = await response.json();
      expect(data.async).toBe(true);
      expect(typeof data.timestamp).toBe('number');
    });
  });
});
