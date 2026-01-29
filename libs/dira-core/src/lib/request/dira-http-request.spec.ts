import { describe, expect, it } from 'bun:test';

import { DiraHttpRequest } from './dira-http-request';
import type { DiraHttpRequestFactory } from './dira-http-request-factory';

type Body = { ok: boolean };

type QParams = {
  // Nur compile-time – zur Laufzeit bleibt es ein URLSearchParams.
  foo?: string;
};

function makeFactoryStub() {
  const calls = {
    request: 0,
    url: 0,
    method: 0,
    headers: 0,
    queryParams: 0,
    jsonBody: 0,
    stringBody: 0,
    formDataBody: 0,
  };

  const headers = new Headers({ 'x-test': '1' });
  const queryParams = new URLSearchParams('foo=bar');
  const request = new Request('https://example.test/path?foo=bar', {
    method: 'POST',
    headers,
  });

  const jsonBodyPromise = Promise.resolve({ ok: true } satisfies Body);
  const stringBodyPromise = Promise.resolve('hello');
  const formDataBodyPromise = Promise.resolve(new FormData());

  const factory: DiraHttpRequestFactory = {
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

  return { factory, calls, request, headers, queryParams, jsonBodyPromise, stringBodyPromise, formDataBodyPromise };
}

describe('DiraHttpRequest', () => {
  it('delegiert alle Getter an die Factory', async () => {
    const { factory, request, headers, queryParams } = makeFactoryStub();
    const req = new DiraHttpRequest<Body, QParams>(factory);

    expect(req.request).toBe(request);
    expect(req.url).toBe('https://example.test/path?foo=bar');
    expect(req.method).toBe('POST');
    expect(req.headers).toBe(headers);

    // params ist der "roh"-Zugriff auf URLSearchParams
    expect(req.params).toBe(queryParams);
    expect(req.params.get('foo')).toBe('bar');

    // queryParams ist nur typisiert, zur Laufzeit identisch
    expect(req.queryParams as unknown).toBe(queryParams);

    await expect(req.jsonBody).resolves.toEqual({ ok: true });
    await expect(req.stringBody).resolves.toBe('hello');
    await expect(req.formDataBody).resolves.toBeInstanceOf(FormData);
  });

  it('cached @Singleton Getter: mehrfacher Zugriff liefert dieselbe Referenz und triggert Factory-Getter nur 1x', () => {
    const { factory, calls } = makeFactoryStub();
    const req = new DiraHttpRequest<Body, QParams>(factory);

    // noch keine Zugriffe
    expect(calls.request).toBe(0);

    const r1 = req.request;
    const r2 = req.request;
    expect(r2).toBe(r1);
    expect(calls.request).toBe(1);

    const h1 = req.headers;
    const h2 = req.headers;
    expect(h2).toBe(h1);
    expect(calls.headers).toBe(1);

    const p1 = req.params;
    const p2 = req.params;
    expect(p2).toBe(p1);
    expect(calls.queryParams).toBe(1);

    const u1 = req.url;
    const u2 = req.url;
    expect(u2).toBe(u1);
    expect(calls.url).toBe(1);

    const m1 = req.method;
    const m2 = req.method;
    expect(m2).toBe(m1);
    expect(calls.method).toBe(1);

    const jb1 = req.jsonBody;
    const jb2 = req.jsonBody;
    expect(jb2).toBe(jb1);
    expect(calls.jsonBody).toBe(1);

    const sb1 = req.stringBody;
    const sb2 = req.stringBody;
    expect(sb2).toBe(sb1);
    expect(calls.stringBody).toBe(1);

    const fd1 = req.formDataBody;
    const fd2 = req.formDataBody;
    expect(fd2).toBe(fd1);
    expect(calls.formDataBody).toBe(1);
  });

  it('queryParams (ohne @Singleton) delegiert jedes Mal neu (kein Cache-Zwang)', () => {
    const { factory, calls, queryParams } = makeFactoryStub();
    const req = new DiraHttpRequest<Body, QParams>(factory);

    // queryParams nutzt factory.queryParams direkt (kein @Singleton), daher 2 Zugriffe = 2 calls
    expect(req.queryParams as unknown).toBe(queryParams);
    expect(req.queryParams as unknown).toBe(queryParams);

    expect(calls.queryParams).toBe(2);

    // params ist @Singleton und sollte trotzdem nur einmal delegieren
    void req.params;
    void req.params;
    expect(calls.queryParams).toBe(3);
  });
});

