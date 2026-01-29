/**
 * Information about a running server instance.
 * Returned by adapters after starting to provide runtime details.
 */
export interface ServerInfo {
  /** The actual port the server is listening on (useful when port 0 was requested) */
  port: number;
  /** The hostname the server is bound to */
  hostname: string;
}
