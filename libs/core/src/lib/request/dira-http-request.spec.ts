import { describe, expect, it } from 'bun:test';

import { DiraHttpRequest } from './dira-http-request';
import type { RequestDataProvider } from './request-data-provider';

type Body = { ok: boolean };

type Query = {
  foo?: string;
  bar?: string[];
};

type Params = {
  id: string;
};

function makeFactoryStub() {
  const calls = {
    request: 0,
    url: 0,
    method: 0,
    headers: 0,
    queryParams: 0,
    pathParams: 0,
    jsonBody: 0,
    stringBody: 0,
    formDataBody: 0,
  };

  const headers = new Headers({ 'x-test': '1' });
  const queryParams = new URLSearchParams('foo=bar');
  const pathParams = { id: '123' };
  const request = new Request('https://example.test/path?foo=bar', {
    method: 'POST',
    headers,
  });

  const jsonBodyPromise = Promise.resolve({ ok: true } satisfies Body);
  const stringBodyPromise = Promise.resolve('hello');
  const formDataBodyPromise = Promise.resolve(new FormData());

  const factory: RequestDataProvider = {
    get request() {
      calls.request++;
      return request;
    },
    get url() {
      calls.url++;
      return 'https://example.test/path?foo=bar';
    },
    get method() {
      calls.method++;
      return 'POST';
    },
    get headers() {
      calls.headers++;
      return headers;
    },
    get queryParams() {
      calls.queryParams++;
      return queryParams;
    },
    get pathParams() {
      calls.pathParams++;
      return pathParams;
    },
    get jsonBody() {
      calls.jsonBody++;
      return jsonBodyPromise;
    },
    get stringBody() {
      calls.stringBody++;
      return stringBodyPromise;
    },
    get formDataBody() {
      calls.formDataBody++;
      return formDataBodyPromise;
    },
  };

  return {
    factory,
    calls,
    request,
    headers,
    queryParams,
    pathParams,
    jsonBodyPromise,
    stringBodyPromise,
    formDataBodyPromise,
  };
}

describe('DiraHttpRequest', () => {
  it('delegates all getters to the factory', async () => {
    const { factory, request, headers, pathParams } = makeFactoryStub();
    const req = new DiraHttpRequest<Body, Query, Params>(factory);

    expect(req.request).toBe(request);
    expect(req.raw).toBe(request);
    expect(req.url).toBe('https://example.test/path?foo=bar');
    expect(req.method).toBe('POST');
    expect(req.headers).toBe(headers);

    // params returns path parameters
    expect(req.params).toEqual(pathParams);
    expect(req.params.id).toBe('123');

    // query returns parsed query parameters as object
    expect(req.query).toEqual({ foo: 'bar' });

    await expect(req.json()).resolves.toEqual({ ok: true });
    await expect(req.text()).resolves.toBe('hello');
    await expect(req.formData()).resolves.toBeInstanceOf(FormData);
  });

  it('returns consistent values from getters', () => {
    const { factory, request, headers } = makeFactoryStub();
    const req = new DiraHttpRequest<Body, Query, Params>(factory);

    // Multiple accesses should return consistent values
    expect(req.request).toBe(request);
    expect(req.request).toBe(request);
    expect(req.headers).toBe(headers);
    expect(req.headers).toBe(headers);
    expect(req.url).toBe('https://example.test/path?foo=bar');
    expect(req.method).toBe('POST');
  });

  it('parses query parameters correctly', () => {
    const queryParams = new URLSearchParams('single=one&multi=a&multi=b');
    const factory: RequestDataProvider = {
      get request() {
        return new Request('https://example.test');
      },
      get url() {
        return 'https://example.test';
      },
      get method() {
        return 'GET';
      },
      get headers() {
        return new Headers();
      },
      get queryParams() {
        return queryParams;
      },
      get pathParams() {
        return {};
      },
      get jsonBody() {
        return Promise.resolve(null);
      },
      get stringBody() {
        return Promise.resolve('');
      },
      get formDataBody() {
        return Promise.resolve(new FormData());
      },
    };

    const req = new DiraHttpRequest<
      unknown,
      { single?: string; multi?: string[] }
    >(factory);

    expect(req.query.single).toBe('one');
    expect(req.query.multi).toEqual(['a', 'b']);
  });

  it('provides raw as alias for request', () => {
    const { factory, request } = makeFactoryStub();
    const req = new DiraHttpRequest<Body, Query, Params>(factory);

    expect(req.raw).toBe(request);
    expect(req.request).toBe(request);
  });

  it('provides json, text, and formData methods', async () => {
    const { factory, jsonBodyPromise, stringBodyPromise, formDataBodyPromise } =
      makeFactoryStub();
    const req = new DiraHttpRequest<Body, Query, Params>(factory);

    expect(req.json()).toBe(jsonBodyPromise);
    expect(req.text()).toBe(stringBodyPromise);
    expect(req.formData()).toBe(formDataBodyPromise);

    await expect(req.json()).resolves.toEqual({ ok: true });
    await expect(req.text()).resolves.toBe('hello');
    await expect(req.formData()).resolves.toBeInstanceOf(FormData);
  });
});
