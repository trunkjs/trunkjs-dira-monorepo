/** Metadata stored for each HTTP handler method in a controller. */
export interface ControllerMetadata {
  /** Route path for this handler. */
  route: string;
  /** Method name on the controller class. */
  method: string;
  /** HTTP method (GET, POST, etc.). Reserved for future use. */
  httpMethod?: string;
}
