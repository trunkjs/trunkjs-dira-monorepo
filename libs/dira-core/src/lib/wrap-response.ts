/**
 * Wraps a handler return value in a Response if needed.
 * - Response objects are returned as-is
 * - null/undefined produce 204 No Content
 * - All other values are JSON serialized with 200 OK
 */
export async function wrapResponse(value: unknown): Promise<Response> {
  // Await if Promise
  const resolved = value instanceof Promise ? await value : value;

  // Already a Response - return as-is
  if (resolved instanceof Response) {
    return resolved;
  }

  // Null/undefined → 204 No Content
  if (resolved == null) {
    return new Response(null, { status: 204 });
  }

  // Object/Array/primitive → JSON Response
  return new Response(JSON.stringify(resolved), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
