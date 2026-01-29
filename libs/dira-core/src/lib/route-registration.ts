import type { HttpHandler } from './http-handler';
import type { HttpMethod } from './http-method';

export interface RouteRegistration {
  route: string;
  handler: HttpHandler;
  /** HTTP method(s) this route responds to. Undefined means all methods. */
  methods?: HttpMethod[];
  /** Full route name for SDK generation (e.g., "api.users.get-by-id"). */
  name?: string;
}
