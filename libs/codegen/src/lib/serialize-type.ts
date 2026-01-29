import ts from 'typescript';
import type { TypeReference, TypeImportInfo } from './type-reference';

/**
 * Maximum recursion depth for type serialization.
 * Prevents stack overflow on deeply nested or pathological types.
 */
const MAX_SERIALIZATION_DEPTH = 15;

/** Built-in types that should never be imported */
const BUILTIN_TYPES = new Set([
  'string',
  'number',
  'boolean',
  'null',
  'undefined',
  'void',
  'never',
  'any',
  'unknown',
  'object',
  'Array',
  'Promise',
  'Response',
  'Date',
  'Map',
  'Set',
  'Record',
  'Partial',
  'Required',
  'Pick',
  'Omit',
  'Exclude',
  'Extract',
  'NonNullable',
  'ReturnType',
  'Parameters',
  'InstanceType',
  'Awaited',
]);

/**
 * Extracts a TypeReference containing both the serialized type and import metadata.
 * Returns importInfo: null for types that cannot be imported (anonymous, non-exported, built-in, external).
 */
export function extractTypeReference(
  type: ts.Type,
  checker: ts.TypeChecker,
): TypeReference {
  const inlineType = serializeType(type, checker);
  const importInfo = extractImportInfo(type, checker);

  return { inlineType, importInfo };
}

/**
 * Attempts to extract import metadata for a type.
 * Returns null if the type cannot be imported.
 */
function extractImportInfo(
  type: ts.Type,
  checker: ts.TypeChecker,
): TypeImportInfo | null {
  // Get the symbol - prefer alias symbol for type aliases
  const symbol = type.aliasSymbol ?? type.getSymbol();
  if (!symbol) return null;

  const typeName = symbol.getName();

  // Skip built-in types
  if (BUILTIN_TYPES.has(typeName)) return null;

  // Skip anonymous types (object literals, etc.)
  if (typeName === '__type' || typeName === '__object') return null;

  // Get the declaration to find the source file
  const declarations = symbol.getDeclarations();
  if (!declarations || declarations.length === 0) return null;

  const declaration = declarations[0];
  const sourceFile = declaration.getSourceFile();
  const filePath = sourceFile.fileName;

  // Skip types from node_modules or .d.ts files
  if (filePath.includes('node_modules') || filePath.endsWith('.d.ts')) {
    return null;
  }

  // Check if the type is exported
  if (!isExportedSymbol(symbol, sourceFile, checker)) {
    return null;
  }

  return {
    typeName,
    sourceFilePath: filePath,
    isTypeOnly: true,
  };
}

/**
 * Checks if a symbol is exported from its containing source file.
 */
function isExportedSymbol(
  symbol: ts.Symbol,
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
): boolean {
  // Get the source file's symbol to check exports
  const sourceSymbol = checker.getSymbolAtLocation(sourceFile);
  if (!sourceSymbol) {
    // Fall back to checking declaration modifiers
    return hasExportModifier(symbol);
  }

  const exports = checker.getExportsOfModule(sourceSymbol);
  return exports.some(
    (exp) =>
      exp === symbol ||
      exp.name === symbol.name ||
      (exp.flags & ts.SymbolFlags.Alias &&
        checker.getAliasedSymbol(exp) === symbol),
  );
}

/**
 * Checks if a symbol's declaration has an export modifier.
 */
function hasExportModifier(symbol: ts.Symbol): boolean {
  const declarations = symbol.getDeclarations();
  if (!declarations || declarations.length === 0) return false;

  for (const decl of declarations) {
    const modifiers = ts.canHaveModifiers(decl)
      ? ts.getModifiers(decl)
      : undefined;
    if (modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
      return true;
    }
  }
  return false;
}

/**
 * Converts a `ts.Type` into its string representation for code generation.
 * Handles primitives, literals, unions, intersections, arrays, object types,
 * and unwraps `Promise<T>`. Uses a `visited` set to handle circular references
 * and a depth limit to prevent stack overflow on deeply nested types.
 */
export function serializeType(
  type: ts.Type,
  checker: ts.TypeChecker,
  visited: Set<ts.Type> = new Set(),
  depth: number = 0,
): string {
  // Guard against excessively deep recursion (pathological or circular types)
  if (depth > MAX_SERIALIZATION_DEPTH) {
    return 'unknown';
  }

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

  const nextDepth = depth + 1;

  if (type.isUnion()) {
    const parts = type.types.map((t) =>
      serializeType(t, checker, visited, nextDepth),
    );
    return parts.join(' | ');
  }

  if (type.isIntersection()) {
    const parts = type.types.map((t) =>
      serializeType(t, checker, visited, nextDepth),
    );
    return parts.join(' & ');
  }

  if (checker.isArrayType(type)) {
    const typeArgs = checker.getTypeArguments(type as ts.TypeReference);
    if (typeArgs.length === 1) {
      const inner = serializeType(typeArgs[0], checker, visited, nextDepth);
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
          return serializeType(typeArgs[0], checker, visited, nextDepth);
        }
      }

      if (name === 'Array') {
        const typeArgs = checker.getTypeArguments(ref);
        if (typeArgs.length === 1) {
          const inner = serializeType(typeArgs[0], checker, visited, nextDepth);
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
        const serialized = serializeType(propType, checker, visited, nextDepth);
        return `${prop.getName()}${optional}: ${serialized}`;
      });
      visited.delete(type);
      return `{ ${members.join('; ')} }`;
    }
  }

  // Fallback
  return checker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation);
}
