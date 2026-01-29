import type { RequestDataProvider } from './request-data-provider';

/**
 * Default implementation of RequestDataProvider.
 * Wraps a raw Request and extracted path parameters, providing lazy access to all request data.
 */
export class HttpRequestDataProvider implements RequestDataProvider {
  private _queryParams: URLSearchParams | null = null;

  constructor(
    private readonly rawRequest: Request,
    private readonly _pathParams: Record<string, string>,
  ) {}

  get request(): Request {
    return this.rawRequest;
  }

  get url(): string {
    return this.rawRequest.url;
  }

  get method(): string {
    return this.rawRequest.method;
  }

  get headers(): Headers {
    return this.rawRequest.headers;
  }

  get queryParams(): URLSearchParams {
    if (this._queryParams === null) {
      this._queryParams = new URL(this.rawRequest.url).searchParams;
    }
    return this._queryParams;
  }

  get pathParams(): Record<string, string> {
    return this._pathParams;
  }

  get jsonBody(): Promise<unknown> {
    return this.rawRequest.json();
  }

  get stringBody(): Promise<string> {
    return this.rawRequest.text();
  }

  get formDataBody(): Promise<FormData> {
    return this.rawRequest.formData();
  }
}
