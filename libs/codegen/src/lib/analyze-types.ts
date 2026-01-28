import ts from 'typescript';
import { serializeType } from './serialize-type';

export interface AnalyzedTypes {
  bodyType: string | null;
  queryType: string | null;
  returnType: string;
  route?: string;
}

/**
 * Extracts body, query, and return types from a `handler<TBody, TQuery>()('/route', fn)` property.
 */
export function analyzeHandlerProperty(
  member: ts.PropertyDeclaration,
  checker: ts.TypeChecker,
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
      }
    }
    if (typeArgs.length >= 2) {
      const queryTsType = checker.getTypeFromTypeNode(typeArgs[1]);
      const serialized = serializeType(queryTsType, checker);
      if (!isDefaultQueryType(serialized)) {
        result.queryType = serialized;
      }
    }
  }

  const arrowFn = findArrowFnArg(routeCall);
  if (arrowFn) {
    const sig = checker.getSignatureFromDeclaration(arrowFn);
    if (sig) {
      const rawReturnType = checker.getReturnTypeOfSignature(sig);
      result.returnType = unwrapReturnType(rawReturnType, checker);
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
          }
        }
        if (typeArgs.length >= 2) {
          const queryTsType = checker.getTypeFromTypeNode(typeArgs[1]);
          const serialized = serializeType(queryTsType, checker);
          if (!isDefaultQueryType(serialized)) {
            result.queryType = serialized;
          }
        }
      }
    }
  }

  const sig = checker.getSignatureFromDeclaration(member);
  if (sig) {
    const rawReturnType = checker.getReturnTypeOfSignature(sig);
    result.returnType = unwrapReturnType(rawReturnType, checker);
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
): string {
  let unwrapped = type;
  const symbol = type.getSymbol();
  if (symbol?.getName() === 'Promise') {
    const typeArgs = checker.getTypeArguments(type as ts.TypeReference);
    if (typeArgs.length === 1) {
      unwrapped = typeArgs[0];
    }
  }

  if (unwrapped.isUnion()) {
    const filtered = unwrapped.types.filter((t) => {
      const name = t.getSymbol()?.getName();
      if (name === 'Response') return false;
      const flags = t.getFlags();
      if (flags & ts.TypeFlags.Void) return false;
      if (flags & ts.TypeFlags.Null) return false;
      if (flags & ts.TypeFlags.Undefined) return false;
      return true;
    });

    if (filtered.length === 0) return 'unknown';
    if (filtered.length === 1) return serializeType(filtered[0], checker);
    return filtered.map((t) => serializeType(t, checker)).join(' | ');
  }

  if (unwrapped.getSymbol()?.getName() === 'Response') return 'unknown';

  const flags = unwrapped.getFlags();
  if (flags & ts.TypeFlags.Void) return 'unknown';

  return serializeType(unwrapped, checker);
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
