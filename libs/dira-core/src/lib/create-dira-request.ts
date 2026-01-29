import type { DiraRequest } from './dira-request';

/**
 * Creates a DiraRequest from a raw Request and extracted path parameters.
 * @param raw - The original Request object
 * @param params - Path parameters extracted from the URL
 * @returns A DiraRequest instance with typed accessors
 */
export function createDiraRequest<
  TBody = unknown,
  TQuery extends Record<string, string | string[] | undefined> = Record<
    string,
    string | string[] | undefined
  >,
  TParams extends Record<string, string> = Record<string, string>,
>(raw: Request, params: TParams): DiraRequest<TBody, TQuery, TParams> {
  // Parse query parameters from URL
  const url = new URL(raw.url);
  const query = {} as Record<string, string | string[]>;

  url.searchParams.forEach((value, key) => {
    const existing = query[key];
    if (existing === undefined) {
      query[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      query[key] = [existing, value];
    }
  });

  return {
    raw,
    params,
    query: query as TQuery,
    headers: raw.headers,
    method: raw.method,
    url: raw.url,
    json: () => raw.json() as Promise<TBody>,
    text: () => raw.text(),
    formData: () => raw.formData(),
  };
}
