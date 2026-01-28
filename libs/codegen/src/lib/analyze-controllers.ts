import ts from 'typescript';
import type { ExtractedRoute } from './extracted-route';
import { stripControllerSuffix, toCamelCase } from './name-utils';
import { getControllerDecorator, getHttpDecorator } from './parse-decorators';
import {
  analyzeHandlerProperty,
  analyzeMethodDeclaration,
  type AnalyzeOptions,
} from './analyze-types';

export interface AnalyzeControllersOptions {
  /** When true, extract rich type references for importing */
  extractRefs?: boolean;
}

/**
 * Creates a TypeScript program from the given files and tsconfig, then walks
 * the AST to extract route metadata from `@DiraController` / `@DiraHttp` decorated classes.
 */
export function analyzeControllers(
  filePatterns: string[],
  tsconfigPath: string,
  options?: AnalyzeControllersOptions,
): ExtractedRoute[] {
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    tsconfigPath.replace(/[/\\][^/\\]+$/, ''),
  );

  const program = ts.createProgram({
    rootNames: filePatterns,
    options: parsedConfig.options,
  });
  const checker = program.getTypeChecker();

  const routes: ExtractedRoute[] = [];

  for (const filePath of filePatterns) {
    const sourceFile = program.getSourceFile(filePath);
    if (!sourceFile) continue;

    ts.forEachChild(sourceFile, (node) => {
      if (!ts.isClassDeclaration(node) || !node.name) return;

      const controllerInfo = getControllerDecorator(node);
      if (!controllerInfo) return;

      const { prefix, name: controllerNameRaw } = controllerInfo;
      const controllerName =
        controllerNameRaw ?? toCamelCase(stripControllerSuffix(node.name.text));

      const analyzeOpts: AnalyzeOptions = { extractRefs: options?.extractRefs };

      for (const member of node.members) {
        const httpInfo = getHttpDecorator(member);
        if (!httpInfo) continue;

        const handlerName = toCamelCase(httpInfo.name);
        const httpMethods = httpInfo.httpMethods;

        let bodyType: string | null = null;
        let queryType: string | null = null;
        let returnType = 'unknown';
        let handlerRoute: string | undefined;
        let bodyTypeRef: ExtractedRoute['bodyTypeRef'];
        let queryTypeRef: ExtractedRoute['queryTypeRef'];
        let returnTypeRef: ExtractedRoute['returnTypeRef'];

        if (ts.isPropertyDeclaration(member)) {
          const result = analyzeHandlerProperty(member, checker, analyzeOpts);
          bodyType = result.bodyType;
          queryType = result.queryType;
          returnType = result.returnType;
          handlerRoute = result.route;
          bodyTypeRef = result.bodyTypeRef;
          queryTypeRef = result.queryTypeRef;
          returnTypeRef = result.returnTypeRef;
        } else if (ts.isMethodDeclaration(member)) {
          const result = analyzeMethodDeclaration(member, checker, analyzeOpts);
          bodyType = result.bodyType;
          queryType = result.queryType;
          returnType = result.returnType;
          bodyTypeRef = result.bodyTypeRef;
          queryTypeRef = result.queryTypeRef;
          returnTypeRef = result.returnTypeRef;
        }

        const route = httpInfo.route ?? handlerRoute ?? '';
        const fullRoute = normalizeRoute(prefix + route);
        const pathParams = extractPathParams(fullRoute);

        const extracted: ExtractedRoute = {
          controllerName,
          handlerName,
          fullRoute,
          httpMethods,
          bodyType,
          queryType,
          returnType,
          pathParams,
        };

        if (options?.extractRefs) {
          extracted.bodyTypeRef = bodyTypeRef;
          extracted.queryTypeRef = queryTypeRef;
          extracted.returnTypeRef = returnTypeRef;
        }

        routes.push(extracted);
      }
    });
  }

  return routes;
}

function normalizeRoute(route: string): string {
  return route.replace(/\/+/g, '/') || '/';
}

function extractPathParams(route: string): string[] {
  const params: string[] = [];
  const regex = /::?(\w+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(route)) !== null) {
    params.push(match[1]);
  }
  return params;
}
