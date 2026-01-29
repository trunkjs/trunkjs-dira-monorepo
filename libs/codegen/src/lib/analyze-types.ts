import ts from 'typescript';
import { serializeType, extractTypeReference } from './serialize-type';
import type { TypeReference } from './type-reference';

export interface AnalyzeOptions {
  /** When true, extract rich type references for importing */
  extractRefs?: boolean;
}

export interface AnalyzedTypes {
  bodyType: string | null;
  queryType: string | null;
  returnType: string;
  route?: string;

  /** Rich type reference for body (when extractRefs enabled) */
  bodyTypeRef?: TypeReference | null;
  /** Rich type reference for query (when extractRefs enabled) */
  queryTypeRef?: TypeReference | null;
  /** Rich type reference for return type (when extractRefs enabled) */
  returnTypeRef?: TypeReference;
}

/**
 * Extracts body, query, and return types from a `handler<TBody, TQuery>()('/route', fn)` property.
 */
export function analyzeHandlerProperty(
  member: ts.PropertyDeclaration,
  checker: ts.TypeChecker,
  options?: AnalyzeOptions,
): AnalyzedTypes {
  const result: AnalyzedTypes = {
    bodyType: null,
    queryType: null,
    returnType: 'unknown',
  };

  if (!member.initializer) return result;

  const { callExpr, outerCallExpr } = findHandlerCall(member.initializer);
  if (!callExpr) return result;

  const routeCall = outerCallExpr ?? callExpr;
  if (
    routeCall.arguments.length >= 1 &&
    ts.isStringLiteral(routeCall.arguments[0])
  ) {
    result.route = routeCall.arguments[0].text;
  }

  const typeArgCall = outerCallExpr ? callExpr : null;
  if (typeArgCall && typeArgCall.typeArguments) {
    const typeArgs = typeArgCall.typeArguments;
    if (typeArgs.length >= 1) {
      const bodyTsType = checker.getTypeFromTypeNode(typeArgs[0]);
      const serialized = serializeType(bodyTsType, checker);
      if (!isDefaultType(serialized)) {
        result.bodyType = serialized;
        if (options?.extractRefs) {
          result.bodyTypeRef = extractTypeReference(bodyTsType, checker);
        }
      }
    }
    if (typeArgs.length >= 2) {
      const queryTsType = checker.getTypeFromTypeNode(typeArgs[1]);
      const serialized = serializeType(queryTsType, checker);
      if (!isDefaultQueryType(serialized)) {
        result.queryType = serialized;
        if (options?.extractRefs) {
          result.queryTypeRef = extractTypeReference(queryTsType, checker);
        }
      }
    }
  }

  const arrowFn = findArrowFnArg(routeCall);
  if (arrowFn) {
    const sig = checker.getSignatureFromDeclaration(arrowFn);
    if (sig) {
      const rawReturnType = checker.getReturnTypeOfSignature(sig);
      result.returnType = unwrapReturnType(rawReturnType, checker, options);
      if (options?.extractRefs) {
        result.returnTypeRef = unwrapReturnTypeRef(rawReturnType, checker);
      }
    }
  }

  return result;
}

/**
 * Extracts body, query, and return types from a method with a `DiraRequest<TBody, TQuery>` parameter.
 */
export function analyzeMethodDeclaration(
  member: ts.MethodDeclaration,
  checker: ts.TypeChecker,
  options?: AnalyzeOptions,
): AnalyzedTypes {
  const result: AnalyzedTypes = {
    bodyType: null,
    queryType: null,
    returnType: 'unknown',
  };

  if (member.parameters.length >= 1) {
    const param = member.parameters[0];
    if (param.type && ts.isTypeReferenceNode(param.type)) {
      const typeName = param.type.typeName;
      const name = ts.isIdentifier(typeName) ? typeName.text : '';

      if (name === 'DiraRequest' && param.type.typeArguments) {
        const typeArgs = param.type.typeArguments;
        if (typeArgs.length >= 1) {
          const bodyTsType = checker.getTypeFromTypeNode(typeArgs[0]);
          const serialized = serializeType(bodyTsType, checker);
          if (!isDefaultType(serialized)) {
            result.bodyType = serialized;
            if (options?.extractRefs) {
              result.bodyTypeRef = extractTypeReference(bodyTsType, checker);
            }
          }
        }
        if (typeArgs.length >= 2) {
          const queryTsType = checker.getTypeFromTypeNode(typeArgs[1]);
          const serialized = serializeType(queryTsType, checker);
          if (!isDefaultQueryType(serialized)) {
            result.queryType = serialized;
            if (options?.extractRefs) {
              result.queryTypeRef = extractTypeReference(queryTsType, checker);
            }
          }
        }
      }
    }
  }

  const sig = checker.getSignatureFromDeclaration(member);
  if (sig) {
    const rawReturnType = checker.getReturnTypeOfSignature(sig);
    result.returnType = unwrapReturnType(rawReturnType, checker, options);
    if (options?.extractRefs) {
      result.returnTypeRef = unwrapReturnTypeRef(rawReturnType, checker);
    }
  }

  return result;
}

function findHandlerCall(expr: ts.Expression): {
  callExpr: ts.CallExpression | undefined;
  outerCallExpr: ts.CallExpression | undefined;
} {
  if (ts.isCallExpression(expr) && ts.isCallExpression(expr.expression)) {
    const inner = expr.expression;
    if (isHandlerIdentifier(inner)) {
      return { callExpr: inner, outerCallExpr: expr };
    }
  }

  if (ts.isCallExpression(expr) && isHandlerIdentifier(expr)) {
    return { callExpr: expr, outerCallExpr: undefined };
  }

  return { callExpr: undefined, outerCallExpr: undefined };
}

function isHandlerIdentifier(expr: ts.CallExpression): boolean {
  return ts.isIdentifier(expr.expression) && expr.expression.text === 'handler';
}

function findArrowFnArg(
  call: ts.CallExpression,
): ts.ArrowFunction | ts.FunctionExpression | undefined {
  for (const arg of call.arguments) {
    if (ts.isArrowFunction(arg) || ts.isFunctionExpression(arg)) {
      return arg;
    }
  }
  return undefined;
}

/**
 * Unwraps `Promise<T>` and filters out `Response`, `void`, `null`, and `undefined`
 * from `HandlerReturn` union types, returning the serialized inner type.
 */
export function unwrapReturnType(
  type: ts.Type,
  checker: ts.TypeChecker,
  _options?: AnalyzeOptions,
): string {
  const unwrapped = unwrapPromise(type, checker);

  if (unwrapped.isUnion()) {
    const filtered = filterUnionTypes(unwrapped.types);

    if (filtered.length === 0) return 'unknown';
    if (filtered.length === 1) return serializeType(filtered[0], checker);
    return filtered.map((t) => serializeType(t, checker)).join(' | ');
  }

  if (unwrapped.getSymbol()?.getName() === 'Response') return 'unknown';

  const flags = unwrapped.getFlags();
  if (flags & ts.TypeFlags.Void) return 'unknown';

  return serializeType(unwrapped, checker);
}

/**
 * Unwraps `Promise<T>` and filters union types, returning a TypeReference.
 * For union types with multiple remaining members, returns inline (can't import a union directly).
 */
function unwrapReturnTypeRef(
  type: ts.Type,
  checker: ts.TypeChecker,
): TypeReference {
  const unwrapped = unwrapPromise(type, checker);

  if (unwrapped.isUnion()) {
    const filtered = filterUnionTypes(unwrapped.types);

    if (filtered.length === 0) {
      return { inlineType: 'unknown', importInfo: null };
    }
    if (filtered.length === 1) {
      return extractTypeReference(filtered[0], checker);
    }
    // Union with multiple types - can't import a union, use inline
    const inlineType = filtered
      .map((t) => serializeType(t, checker))
      .join(' | ');
    return { inlineType, importInfo: null };
  }

  if (unwrapped.getSymbol()?.getName() === 'Response') {
    return { inlineType: 'unknown', importInfo: null };
  }

  const flags = unwrapped.getFlags();
  if (flags & ts.TypeFlags.Void) {
    return { inlineType: 'unknown', importInfo: null };
  }

  return extractTypeReference(unwrapped, checker);
}

/**
 * Unwraps `Promise<T>` to get the inner type.
 */
function unwrapPromise(type: ts.Type, checker: ts.TypeChecker): ts.Type {
  const symbol = type.getSymbol();
  if (symbol?.getName() === 'Promise') {
    const typeArgs = checker.getTypeArguments(type as ts.TypeReference);
    if (typeArgs.length === 1) {
      return typeArgs[0];
    }
  }
  return type;
}

/**
 * Filters out `Response`, `void`, `null`, and `undefined` from union types.
 */
function filterUnionTypes(types: readonly ts.Type[]): ts.Type[] {
  return types.filter((t) => {
    const name = t.getSymbol()?.getName();
    if (name === 'Response') return false;
    const flags = t.getFlags();
    if (flags & ts.TypeFlags.Void) return false;
    if (flags & ts.TypeFlags.Null) return false;
    if (flags & ts.TypeFlags.Undefined) return false;
    return true;
  });
}

function isDefaultType(serialized: string): boolean {
  return serialized === 'unknown' || serialized === 'any';
}

function isDefaultQueryType(serialized: string): boolean {
  return (
    isDefaultType(serialized) ||
    serialized.includes('Record<string, string | string[] | undefined>')
  );
}
