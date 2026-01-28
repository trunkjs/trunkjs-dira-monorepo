export interface ExtractedRoute {
  controllerName: string;
  handlerName: string;
  fullRoute: string;
  httpMethods: string[] | undefined;
  bodyType: string | null;
  queryType: string | null;
  returnType: string;
  pathParams: string[];
}
