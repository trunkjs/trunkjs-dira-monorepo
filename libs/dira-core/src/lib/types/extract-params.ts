/**
 * Extracts path parameter names from a URL pattern using template literal types.
 * Supports regular params (:param) and wildcard params (::param).
 * Example: "/users/:id/posts/:postId" → { id: string; postId: string }
 * Example: "/files/::path" → { path: string }
 */
export type ExtractParams<T extends string> =
  // Wildcard parameter at end (::param) - must check before regular param
  T extends `${string}::${infer Param}`
    ? { [K in Param]: string }
    : // Regular param followed by more path
      T extends `${string}:${infer Param}/${infer Rest}`
      ? { [K in Param]: string } & ExtractParams<`/${Rest}`>
      : // Regular param at end
        T extends `${string}:${infer Param}`
        ? { [K in Param]: string }
        : {};
