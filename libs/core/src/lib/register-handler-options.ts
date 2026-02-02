import type { DiraHttpRequest } from './request/dira-http-request';
import type { HttpMethod } from './http-method';
import type { DiraMiddleware } from './middleware';

/** Options for registering a handler with a specific request type. */
export interface RegisterHandlerOptions<
  TRequest extends DiraHttpRequest = DiraHttpRequest,
> {
  /** HTTP method(s) this handler responds to. */
  method?: HttpMethod | HttpMethod[];
  /** Route name for SDK generation. */
  name?: string;
  /** Middleware to apply to this handler. */
  middleware?:
    | DiraMiddleware<Record<string, unknown>, Record<string, unknown>, TRequest>
    | DiraMiddleware<
        Record<string, unknown>,
        Record<string, unknown>,
        TRequest
      >[];
}
