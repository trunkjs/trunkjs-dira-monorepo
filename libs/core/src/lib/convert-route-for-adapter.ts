/**
 * Converts a Dira route pattern to an adapter-compatible format.
 *
 * ## Wildcard Parameter Syntax
 *
 * Dira uses `::paramName` syntax for wildcard (catch-all) parameters that capture
 * the rest of the path. This is converted to the standard `*` wildcard syntax
 * used by most HTTP routers (Hono, Express, etc.).
 *
 * ### Examples:
 * - `/files/::path` → `/files/*` (captures "readme.txt" or "docs/api/guide.md")
 * - `/buckets/:bucket/objects/::key` → `/buckets/:bucket/objects/*`
 *
 * ### Why `::` instead of `*`?
 * - Named wildcards (`::path`) provide better type inference for path params
 * - The double-colon visually distinguishes wildcards from regular params (`:id`)
 * - TypeScript can infer `params.path` as string from the route pattern
 *
 * ### Adapter Behavior:
 * - Hono: Uses `*` syntax, captured value available via `c.req.param('*')`
 * - The adapter extracts the wildcard value and maps it to the named param
 *
 * @param route - Dira route pattern (e.g., "/files/::path")
 * @returns Adapter-compatible route (e.g., "/files/*")
 */
export function convertRouteForAdapter(route: string): string {
  return route.replace(/::[\w]+$/, '*');
}
