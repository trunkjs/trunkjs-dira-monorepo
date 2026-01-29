// Utility: Nur nicht-funktionale Keys (Getter/Values) vom Container übernehmen.
// Methoden werden bewusst ausgeschlossen, damit `req.foo()` nicht fälschlich als verfügbar gilt.


import { DiContainer, Singleton } from '@dira/dira-di';
import { DiraHttpRequestFactory } from './dira-http-request-factory';

/**
 * `DiraRequest<TFactory>` ist eine typisierte "Surface" über einer DI-Factory:
 * - `factory` bleibt zugänglich
 * - alle nicht-funktionalen Getter/Values der Factory werden als Properties sichtbar
 *
 * Zur Laufzeit werden diese Properties via Proxy auf `factory.container` weitergeleitet.
 */
export class DiraHttpRequest<TBody, QParams> extends DiContainer {

  public constructor(private factory : DiraHttpRequestFactory) {
    super();
  }


  @Singleton
  get request() : Request {
    return this.factory.request;
  }

  @Singleton
  get params() : URLSearchParams {
    return this.factory.queryParams;
  }

  get queryParams() : QParams {
    return this.factory.queryParams as unknown as QParams;
  }

  @Singleton
  get method() : "POST" | "GET" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD" | string {
    return this.factory.method;
  }

  @Singleton
  get headers() : Headers {
    return this.factory.headers;
  }

  @Singleton
  get url() : string {
    return this.factory.url;
  }

  @Singleton
  get jsonBody() : Promise<TBody> {
    return this.factory.jsonBody;
  }

  @Singleton
  get stringBody() : Promise<string> {
    return this.factory.stringBody;
  }

  @Singleton
  get formDataBody() : Promise<FormData> {
    return this.factory.formDataBody;
  }



}

