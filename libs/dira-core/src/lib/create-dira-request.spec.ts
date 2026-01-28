import { describe, expect, test } from 'bun:test';
import { createDiraRequest } from './create-dira-request';

describe('createDiraRequest', () => {
  test('provides access to raw request', () => {
    const raw = new Request('http://localhost/test');
    const diraReq = createDiraRequest(raw, {});

    expect(diraReq.raw).toBe(raw);
  });

  test('provides typed params', () => {
    const raw = new Request('http://localhost/users/123');
    const params = { id: '123' };
    const diraReq = createDiraRequest(raw, params);

    expect(diraReq.params).toEqual({ id: '123' });
  });

  test('parses single query parameters', () => {
    const raw = new Request('http://localhost/search?q=test&limit=10');
    const diraReq = createDiraRequest(raw, {});

    expect(diraReq.query).toEqual({ q: 'test', limit: '10' });
  });

  test('parses repeated query parameters as array', () => {
    const raw = new Request('http://localhost/filter?tag=a&tag=b&tag=c');
    const diraReq = createDiraRequest(raw, {});

    expect(diraReq.query).toEqual({ tag: ['a', 'b', 'c'] });
  });

  test('handles mixed single and array query params', () => {
    const raw = new Request('http://localhost/api?id=1&tag=a&tag=b');
    const diraReq = createDiraRequest(raw, {});

    expect(diraReq.query).toEqual({ id: '1', tag: ['a', 'b'] });
  });

  test('provides headers', () => {
    const raw = new Request('http://localhost/test', {
      headers: { 'X-Custom': 'value' },
    });
    const diraReq = createDiraRequest(raw, {});

    expect(diraReq.headers.get('X-Custom')).toBe('value');
  });

  test('provides method', () => {
    const raw = new Request('http://localhost/test', { method: 'POST' });
    const diraReq = createDiraRequest(raw, {});

    expect(diraReq.method).toBe('POST');
  });

  test('provides url', () => {
    const raw = new Request('http://localhost/test?foo=bar');
    const diraReq = createDiraRequest(raw, {});

    expect(diraReq.url).toBe('http://localhost/test?foo=bar');
  });

  test('json() parses request body', async () => {
    const raw = new Request('http://localhost/test', {
      method: 'POST',
      body: JSON.stringify({ name: 'test' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const diraReq = createDiraRequest<{ name: string }>(raw, {});

    const body = await diraReq.json();

    expect(body).toEqual({ name: 'test' });
  });

  test('text() returns body as text', async () => {
    const raw = new Request('http://localhost/test', {
      method: 'POST',
      body: 'plain text',
    });
    const diraReq = createDiraRequest(raw, {});

    const text = await diraReq.text();

    expect(text).toBe('plain text');
  });

  test('formData() parses form data', async () => {
    const formData = new FormData();
    formData.append('name', 'test');
    const raw = new Request('http://localhost/test', {
      method: 'POST',
      body: formData,
    });
    const diraReq = createDiraRequest(raw, {});

    const parsed = await diraReq.formData();

    expect(parsed.get('name')).toBe('test');
  });

  test('handles empty query string', () => {
    const raw = new Request('http://localhost/test');
    const diraReq = createDiraRequest(raw, {});

    expect(diraReq.query).toEqual({});
  });
});
