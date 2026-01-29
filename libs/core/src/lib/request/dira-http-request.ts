import { DiContainer } from '@dira/di';
import type { RequestDataProvider } from './request-data-provider';

/**
 * DiraHttpRequest is a DI-enabled request class that provides typed access to request data.
 * Extend this class to add custom request-scoped dependencies.
 *
 * @template TBody - Expected type of the request body
 * @template TQuery - Expected shape of query parameters
 * @template TParams - Expected shape of path parameters
 */
export class DiraHttpRequest<
  TBody = unknown,
  TQuery = Record<string, string | string[] | undefined>,
  TParams = Record<string, string>,
> extends DiContainer {
  private _query: TQuery | null = null;

  public constructor(protected readonly factory: RequestDataProvider) {
    super();
  }

  /** Original Request object for advanced use cases. Alias for `request`. */
  get raw(): Request {
    return this.factory.request;
  }

  /** Original Request object for advanced use cases. */
  get request(): Request {
    return this.factory.request;
  }

  /** Extracted path parameters from the URL, typed as TParams. */
  get params(): TParams {
    return this.factory.pathParams as TParams;
  }

  /** Parsed query parameters from the URL, typed as TQuery. */
  get query(): TQuery {
    if (this._query === null) {
      const result = {} as Record<string, string | string[]>;
      this.factory.queryParams.forEach((value, key) => {
        const existing = result[key];
        if (existing === undefined) {
          result[key] = value;
        } else if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          result[key] = [existing, value];
        }
      });
      this._query = result as TQuery;
    }
    return this._query;
  }

  /** HTTP method (GET, POST, etc.). */
  get method(): string {
    return this.factory.method;
  }

  /** Request headers. */
  get headers(): Headers {
    return this.factory.headers;
  }

  /** Full request URL. */
  get url(): string {
    return this.factory.url;
  }

  /** Parses the request body as JSON and returns it typed as TBody. */
  json(): Promise<TBody> {
    return this.factory.jsonBody as Promise<TBody>;
  }

  /** Returns the request body as text. */
  text(): Promise<string> {
    return this.factory.stringBody;
  }

  /** Returns the request body as FormData. */
  formData(): Promise<FormData> {
    return this.factory.formDataBody;
  }
}
