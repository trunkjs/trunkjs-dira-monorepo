import type { DiraHttpRequest } from './dira-http-request';
import type { RequestDataProvider } from './request-data-provider';

/**
 * Type for custom request classes that extend DiraHttpRequest.
 * Used with DiraCore.setRequestClass() to provide custom request-scoped dependencies.
 */
export type DiraHttpRequestClass<
  TBody = unknown,
  TQuery = Record<string, string | string[] | undefined>,
  TParams = Record<string, string>,
> = new (
  factory: RequestDataProvider,
) => DiraHttpRequest<TBody, TQuery, TParams>;
