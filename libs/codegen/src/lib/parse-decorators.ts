import ts from 'typescript';
import { DECORATOR_CONTROLLER, DECORATOR_HTTP } from './constants';

export interface ControllerDecoratorInfo {
  prefix: string;
  name: string | undefined;
}

export interface HttpDecoratorInfo {
  route: string | undefined;
  httpMethods: string[] | undefined;
  name: string;
}

/** Extracts prefix and name from a `@DiraController(prefix, options?)` decorator. */
export function getControllerDecorator(
  node: ts.ClassDeclaration,
): ControllerDecoratorInfo | undefined {
  const decorators = ts.getDecorators(node);
  if (!decorators) return undefined;

  for (const dec of decorators) {
    if (!ts.isCallExpression(dec.expression)) continue;
    const expr = dec.expression;
    if (!ts.isIdentifier(expr.expression)) continue;
    if (expr.expression.text !== DECORATOR_CONTROLLER) continue;

    const args = expr.arguments;
    let prefix = '';
    let name: string | undefined;

    if (args.length >= 1 && ts.isStringLiteral(args[0])) {
      prefix = args[0].text;
    }

    if (args.length >= 2 && ts.isObjectLiteralExpression(args[1])) {
      for (const prop of args[1].properties) {
        if (
          ts.isPropertyAssignment(prop) &&
          ts.isIdentifier(prop.name) &&
          prop.name.text === 'name' &&
          ts.isStringLiteral(prop.initializer)
        ) {
          name = prop.initializer.text;
        }
      }
    }

    return { prefix, name };
  }

  return undefined;
}

/** Extracts route, HTTP methods, and name from a `@DiraHttp(route?, options?)` decorator. */
export function getHttpDecorator(
  member: ts.ClassElement,
): HttpDecoratorInfo | undefined {
  const decorators = ts.getDecorators(member);
  if (!decorators) return undefined;

  for (const dec of decorators) {
    if (!ts.isCallExpression(dec.expression)) continue;
    const expr = dec.expression;
    if (!ts.isIdentifier(expr.expression)) continue;
    if (expr.expression.text !== DECORATOR_HTTP) continue;

    const args = expr.arguments;
    let route: string | undefined;
    let httpMethods: string[] | undefined;
    let name: string | undefined;

    const memberName =
      member.name && ts.isIdentifier(member.name) ? member.name.text : '';

    if (args.length === 0) {
      // @DiraHttp()
    } else if (args.length >= 1 && ts.isStringLiteral(args[0])) {
      route = args[0].text;
      if (args.length >= 2 && ts.isObjectLiteralExpression(args[1])) {
        const opts = parseHttpOptions(args[1]);
        httpMethods = opts.httpMethods;
        name = opts.name;
      }
    } else if (args.length >= 1 && ts.isObjectLiteralExpression(args[0])) {
      const opts = parseHttpOptions(args[0]);
      httpMethods = opts.httpMethods;
      name = opts.name;
    }

    return { route, httpMethods, name: name ?? memberName };
  }

  return undefined;
}

function parseHttpOptions(obj: ts.ObjectLiteralExpression): {
  httpMethods: string[] | undefined;
  name: string | undefined;
} {
  let httpMethods: string[] | undefined;
  let name: string | undefined;

  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) continue;

    if (prop.name.text === 'method') {
      if (ts.isStringLiteral(prop.initializer)) {
        httpMethods = [prop.initializer.text];
      } else if (ts.isArrayLiteralExpression(prop.initializer)) {
        httpMethods = prop.initializer.elements
          .filter(ts.isStringLiteral)
          .map((e) => e.text);
      }
    }

    if (prop.name.text === 'name' && ts.isStringLiteral(prop.initializer)) {
      name = prop.initializer.text;
    }
  }

  return { httpMethods, name };
}
