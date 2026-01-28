/**
 * Converts a Dira route pattern to an adapter-compatible format.
 * Converts wildcard params (::param) to the standard wildcard syntax (*).
 * @param route - Dira route pattern (e.g., "/files/::path")
 * @returns Adapter-compatible route (e.g., "/files/*")
 */
export function convertRouteForAdapter(route: string): string {
  return route.replace(/::[\w]+$/, '*');
}
