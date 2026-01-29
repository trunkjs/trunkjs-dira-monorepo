import { describe, expect, test } from 'bun:test';
import { wrapResponse } from './wrap-response';

describe('wrapResponse', () => {
  test('returns Response as-is', async () => {
    const original = new Response('test', { status: 201 });
    const result = await wrapResponse(original);

    expect(result).toBe(original);
    expect(result.status).toBe(201);
  });

  test('wraps object as JSON response', async () => {
    const result = await wrapResponse({ foo: 'bar' });

    expect(result.status).toBe(200);
    expect(result.headers.get('Content-Type')).toBe('application/json');
    expect(await result.json()).toEqual({ foo: 'bar' });
  });

  test('wraps array as JSON response', async () => {
    const result = await wrapResponse([1, 2, 3]);

    expect(result.status).toBe(200);
    expect(result.headers.get('Content-Type')).toBe('application/json');
    expect(await result.json()).toEqual([1, 2, 3]);
  });

  test('wraps primitive as JSON response', async () => {
    const result = await wrapResponse('hello');

    expect(result.status).toBe(200);
    expect(result.headers.get('Content-Type')).toBe('application/json');
    const parsed = await result.json();
    expect(typeof parsed).toBe('string');
    expect(parsed).toBe('hello');
  });

  test('wraps number as JSON response', async () => {
    const result = await wrapResponse(42);

    expect(result.status).toBe(200);
    const parsed = await result.json();
    expect(typeof parsed).toBe('number');
    expect(parsed).toBe(42);
  });

  test('wraps boolean as JSON response', async () => {
    const result = await wrapResponse(true);

    expect(result.status).toBe(200);
    const parsed = await result.json();
    expect(typeof parsed).toBe('boolean');
    expect(parsed).toBe(true);
  });

  test('returns 204 No Content for null', async () => {
    const result = await wrapResponse(null);

    expect(result.status).toBe(204);
    expect(await result.text()).toBe('');
  });

  test('returns 204 No Content for undefined', async () => {
    const result = await wrapResponse(undefined);

    expect(result.status).toBe(204);
    expect(await result.text()).toBe('');
  });

  test('unwraps Promise and handles result', async () => {
    const result = await wrapResponse(Promise.resolve({ async: true }));

    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ async: true });
  });

  test('unwraps Promise with null', async () => {
    const result = await wrapResponse(Promise.resolve(null));

    expect(result.status).toBe(204);
  });

  test('unwraps Promise with Response', async () => {
    const original = new Response('async', { status: 202 });
    const result = await wrapResponse(Promise.resolve(original));

    expect(result).toBe(original);
  });
});
