import { describe, expect, it } from 'bun:test';

import { HttpRequestDataProvider } from './http-request-data-provider';

describe('HttpRequestDataProvider', () => {
  it('returns the raw request', () => {
    const rawRequest = new Request('https://example.test/path');
    const provider = new HttpRequestDataProvider(rawRequest, {});

    expect(provider.request).toBe(rawRequest);
  });

  it('returns the URL from the request', () => {
    const rawRequest = new Request('https://example.test/path?foo=bar');
    const provider = new HttpRequestDataProvider(rawRequest, {});

    expect(provider.url).toBe('https://example.test/path?foo=bar');
  });

  it('returns the method from the request', () => {
    const rawRequest = new Request('https://example.test', { method: 'POST' });
    const provider = new HttpRequestDataProvider(rawRequest, {});

    expect(provider.method).toBe('POST');
  });

  it('returns the headers from the request', () => {
    const headers = new Headers({ 'x-custom': 'value' });
    const rawRequest = new Request('https://example.test', { headers });
    const provider = new HttpRequestDataProvider(rawRequest, {});

    expect(provider.headers.get('x-custom')).toBe('value');
  });

  it('parses and caches query parameters from URL', () => {
    const rawRequest = new Request('https://example.test/path?foo=bar&baz=qux');
    const provider = new HttpRequestDataProvider(rawRequest, {});

    const params1 = provider.queryParams;
    const params2 = provider.queryParams;

    expect(params1.get('foo')).toBe('bar');
    expect(params1.get('baz')).toBe('qux');
    expect(params1).toBe(params2); // Should be cached
  });

  it('returns the provided path parameters', () => {
    const pathParams = { id: '123', userId: '456' };
    const rawRequest = new Request('https://example.test');
    const provider = new HttpRequestDataProvider(rawRequest, pathParams);

    expect(provider.pathParams).toEqual(pathParams);
    expect(provider.pathParams.id).toBe('123');
    expect(provider.pathParams.userId).toBe('456');
  });

  it('returns JSON body from request', async () => {
    const body = { hello: 'world' };
    const rawRequest = new Request('https://example.test', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
    const provider = new HttpRequestDataProvider(rawRequest, {});

    const result = await provider.jsonBody;
    expect(result).toEqual(body);
  });

  it('returns text body from request', async () => {
    const text = 'Hello, World!';
    const rawRequest = new Request('https://example.test', {
      method: 'POST',
      body: text,
    });
    const provider = new HttpRequestDataProvider(rawRequest, {});

    const result = await provider.stringBody;
    expect(result).toBe(text);
  });

  it('returns FormData body from request', async () => {
    const formData = new FormData();
    formData.append('field', 'value');

    const rawRequest = new Request('https://example.test', {
      method: 'POST',
      body: formData,
    });
    const provider = new HttpRequestDataProvider(rawRequest, {});

    const result = await provider.formDataBody;
    expect(result.get('field')).toBe('value');
  });
});
