import type { TypeReference } from './type-reference';

/**
 * Metadata extracted from a controller handler for code generation.
 * Contains all information needed to generate a typed client method.
 */
export interface ExtractedRoute {
  /** Controller name in camelCase (e.g., "posts" from PostsController) */
  controllerName: string;
  /** Handler method name (e.g., "createPost") */
  handlerName: string;
  /** Full route path including controller prefix (e.g., "/posts/create") */
  fullRoute: string;
  /** Allowed HTTP methods, undefined means all methods */
  httpMethods: string[] | undefined;
  /** Serialized body type string, null if no body expected */
  bodyType: string | null;
  /** Serialized query type string, null if no query params */
  queryType: string | null;
  /** Serialized return type string */
  returnType: string;
  /** Path parameter names extracted from route (e.g., ["id", "postId"]) */
  pathParams: string[];

  /** Rich type reference for body (when importTypes enabled) */
  bodyTypeRef?: TypeReference | null;
  /** Rich type reference for query (when importTypes enabled) */
  queryTypeRef?: TypeReference | null;
  /** Rich type reference for return type (when importTypes enabled) */
  returnTypeRef?: TypeReference;
}
