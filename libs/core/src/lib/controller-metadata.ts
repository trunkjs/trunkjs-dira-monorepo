import type { HttpMethod } from './http-method';

/** Metadata stored for each HTTP handler method in a controller. */
export interface ControllerMetadata {
  /** Route path for this handler. */
  route: string;
  /** Method name on the controller class. */
  method: string;
  /** HTTP method(s) this handler responds to. Undefined means all methods. */
  httpMethods?: HttpMethod[];
  /** Route name for SDK generation. Defaults to method name. */
  name: string;
}
