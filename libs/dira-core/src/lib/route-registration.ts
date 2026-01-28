import type { HttpHandler } from './http-handler';
import type { HttpMethod } from './http-method';

export interface RouteRegistration {
  route: string;
  handler: HttpHandler;
  /** HTTP method(s) this route responds to. Undefined means all methods. */
  methods?: HttpMethod[];
}
