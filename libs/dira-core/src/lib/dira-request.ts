/**
 * Type-safe request object providing typed access to path params, query, and body.
 * @template TBody - Expected type of the request body
 * @template TQuery - Expected shape of query parameters
 * @template TParams - Expected shape of path parameters (auto-inferred from route)
 */
export interface DiraRequest<
  TBody = unknown,
  TQuery extends Record<string, string | string[]> = Record<
    string,
    string | string[]
  >,
  TParams extends Record<string, string> = Record<string, string>,
> {
  /** Original Request object for advanced use cases. */
  readonly raw: Request;

  /** Extracted path parameters from the URL. */
  readonly params: TParams;

  /** Parsed query parameters from the URL. */
  readonly query: TQuery;

  /** Request headers. */
  readonly headers: Headers;

  /** HTTP method (GET, POST, etc.). */
  readonly method: string;

  /** Full request URL. */
  readonly url: string;

  /** Parses the request body as JSON and returns it typed as TBody. */
  json(): Promise<TBody>;

  /** Returns the request body as text. */
  text(): Promise<string>;

  /** Returns the request body as FormData. */
  formData(): Promise<FormData>;
}
