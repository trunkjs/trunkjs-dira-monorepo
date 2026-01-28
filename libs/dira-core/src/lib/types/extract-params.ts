/**
 * Extracts path parameter names from a URL pattern using template literal types.
 * Example: "/users/:id/posts/:postId" → { id: string; postId: string }
 */
export type ExtractParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? { [K in Param]: string } & ExtractParams<`/${Rest}`>
    : T extends `${string}:${infer Param}`
      ? { [K in Param]: string }
      : {};
