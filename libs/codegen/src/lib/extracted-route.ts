import type { TypeReference } from './type-reference';

export interface ExtractedRoute {
  controllerName: string;
  handlerName: string;
  fullRoute: string;
  httpMethods: string[] | undefined;
  bodyType: string | null;
  queryType: string | null;
  returnType: string;
  pathParams: string[];

  /** Rich type reference for body (when importTypes enabled) */
  bodyTypeRef?: TypeReference | null;
  /** Rich type reference for query (when importTypes enabled) */
  queryTypeRef?: TypeReference | null;
  /** Rich type reference for return type (when importTypes enabled) */
  returnTypeRef?: TypeReference;
}
