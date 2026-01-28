import ts from 'typescript';

/**
 * Converts a `ts.Type` into its string representation for code generation.
 * Handles primitives, literals, unions, intersections, arrays, object types,
 * and unwraps `Promise<T>`. Uses a `visited` set to handle circular references.
 */
export function serializeType(
  type: ts.Type,
  checker: ts.TypeChecker,
  visited: Set<ts.Type> = new Set(),
): string {
  if (visited.has(type)) {
    return 'unknown';
  }

  const flags = type.getFlags();

  if (flags & ts.TypeFlags.String) return 'string';
  if (flags & ts.TypeFlags.Number) return 'number';
  if (flags & ts.TypeFlags.Boolean) return 'boolean';
  if (flags & ts.TypeFlags.Null) return 'null';
  if (flags & ts.TypeFlags.Undefined) return 'undefined';
  if (flags & ts.TypeFlags.Void) return 'void';
  if (flags & ts.TypeFlags.Never) return 'never';
  if (flags & ts.TypeFlags.Any) return 'any';
  if (flags & ts.TypeFlags.Unknown) return 'unknown';

  if (flags & ts.TypeFlags.StringLiteral) {
    return `'${(type as ts.StringLiteralType).value}'`;
  }
  if (flags & ts.TypeFlags.NumberLiteral) {
    return `${(type as ts.NumberLiteralType).value}`;
  }
  if (flags & ts.TypeFlags.BooleanLiteral) {
    return (type as ts.Type & { intrinsicName: string }).intrinsicName;
  }

  if (type.isUnion()) {
    const parts = type.types.map((t) => serializeType(t, checker, visited));
    return parts.join(' | ');
  }

  if (type.isIntersection()) {
    const parts = type.types.map((t) => serializeType(t, checker, visited));
    return parts.join(' & ');
  }

  if (checker.isArrayType(type)) {
    const typeArgs = checker.getTypeArguments(type as ts.TypeReference);
    if (typeArgs.length === 1) {
      const inner = serializeType(typeArgs[0], checker, visited);
      const needsParens = inner.includes('|') || inner.includes('&');
      return needsParens ? `(${inner})[]` : `${inner}[]`;
    }
  }

  // Object type with properties
  if (flags & ts.TypeFlags.Object) {
    const objectType = type as ts.ObjectType;

    // Check for type reference (named types like Promise<T>)
    if (objectType.objectFlags & ts.ObjectFlags.Reference) {
      const ref = type as ts.TypeReference;
      const symbol = type.getSymbol();
      const name = symbol?.getName();

      if (name === 'Promise') {
        const typeArgs = checker.getTypeArguments(ref);
        if (typeArgs.length === 1) {
          return serializeType(typeArgs[0], checker, visited);
        }
      }

      if (name === 'Array') {
        const typeArgs = checker.getTypeArguments(ref);
        if (typeArgs.length === 1) {
          const inner = serializeType(typeArgs[0], checker, visited);
          const needsParens = inner.includes('|') || inner.includes('&');
          return needsParens ? `(${inner})[]` : `${inner}[]`;
        }
      }
    }

    const properties = type.getProperties();
    if (properties.length > 0) {
      visited.add(type);
      const members = properties.map((prop) => {
        const propType = checker.getTypeOfSymbol(prop);
        const optional =
          (prop.flags & ts.SymbolFlags.Optional) !== 0 ? '?' : '';
        const serialized = serializeType(propType, checker, visited);
        return `${prop.getName()}${optional}: ${serialized}`;
      });
      visited.delete(type);
      return `{ ${members.join('; ')} }`;
    }
  }

  // Fallback
  return checker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation);
}
