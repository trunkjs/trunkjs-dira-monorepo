/**
 * Interface providing access to HTTP request data.
 * Implementations wrap raw request objects and provide lazy access to request properties.
 */
export interface RequestDataProvider {
  get request(): Request;

  get url(): string;

  get method(): string;

  get headers(): Headers;

  get queryParams(): URLSearchParams;

  get pathParams(): Record<string, string>;

  get jsonBody(): Promise<unknown>;

  get stringBody(): Promise<string>;

  get formDataBody(): Promise<FormData>;
}
