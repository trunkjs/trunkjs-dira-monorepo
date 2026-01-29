import { describe, it, expect } from 'bun:test';
import ts from 'typescript';
import { serializeType, extractTypeReference } from './serialize-type';

function typeFromSource(
  source: string,
  typeName: string = 'T',
): { type: ts.Type; checker: ts.TypeChecker } {
  const fileName = '/test.ts';
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  const host = ts.createCompilerHost({});
  const originalGetSourceFile = host.getSourceFile;
  host.getSourceFile = (name, ...args) => {
    if (name === fileName) return sourceFile;
    return originalGetSourceFile.call(host, name, ...args);
  };
  host.fileExists = (name) => name === fileName || ts.sys.fileExists(name);
  host.readFile = (name) =>
    name === fileName ? source : ts.sys.readFile(name);

  const program = ts.createProgram([fileName], { strict: true }, host);
  const checker = program.getTypeChecker();
  const sf = program.getSourceFile(fileName)!;

  let type: ts.Type | undefined;
  ts.forEachChild(sf, (node) => {
    if (ts.isTypeAliasDeclaration(node) && node.name.text === typeName) {
      type = checker.getTypeFromTypeNode(node.type);
    }
  });

  if (!type) throw new Error(`Type ${typeName} not found`);
  return { type, checker };
}

/**
 * Creates a type from source where the type is defined as an exported interface.
 * Returns the type of the interface for testing extractTypeReference.
 */
function exportedInterfaceFromSource(
  source: string,
  interfaceName: string,
): { type: ts.Type; checker: ts.TypeChecker; fileName: string } {
  const fileName = '/test-file.ts';
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  const host = ts.createCompilerHost({});
  const originalGetSourceFile = host.getSourceFile;
  host.getSourceFile = (name, ...args) => {
    if (name === fileName) return sourceFile;
    return originalGetSourceFile.call(host, name, ...args);
  };
  host.fileExists = (name) => name === fileName || ts.sys.fileExists(name);
  host.readFile = (name) =>
    name === fileName ? source : ts.sys.readFile(name);

  const program = ts.createProgram([fileName], { strict: true }, host);
  const checker = program.getTypeChecker();
  const sf = program.getSourceFile(fileName)!;

  let type: ts.Type | undefined;
  ts.forEachChild(sf, (node) => {
    if (ts.isInterfaceDeclaration(node) && node.name.text === interfaceName) {
      type = checker.getTypeAtLocation(node);
    }
  });

  if (!type) throw new Error(`Interface ${interfaceName} not found`);
  return { type, checker, fileName };
}

describe('serializeType', () => {
  it('should serialize string', () => {
    const { type, checker } = typeFromSource('type T = string;');
    expect(serializeType(type, checker)).toBe('string');
  });

  it('should serialize number', () => {
    const { type, checker } = typeFromSource('type T = number;');
    expect(serializeType(type, checker)).toBe('number');
  });

  it('should serialize boolean', () => {
    const { type, checker } = typeFromSource('type T = boolean;');
    expect(serializeType(type, checker)).toBe('boolean');
  });

  it('should serialize null', () => {
    const { type, checker } = typeFromSource('type T = null;');
    expect(serializeType(type, checker)).toBe('null');
  });

  it('should serialize string literal', () => {
    const { type, checker } = typeFromSource(`type T = 'hello';`);
    expect(serializeType(type, checker)).toBe(`'hello'`);
  });

  it('should serialize number literal', () => {
    const { type, checker } = typeFromSource('type T = 42;');
    expect(serializeType(type, checker)).toBe('42');
  });

  it('should serialize union', () => {
    const { type, checker } = typeFromSource('type T = string | number;');
    expect(serializeType(type, checker)).toBe('string | number');
  });

  it('should serialize array', () => {
    const { type, checker } = typeFromSource('type T = string[];');
    expect(serializeType(type, checker)).toBe('string[]');
  });

  it('should serialize union array with parens', () => {
    const { type, checker } = typeFromSource('type T = (string | number)[];');
    expect(serializeType(type, checker)).toBe('(string | number)[]');
  });

  it('should serialize object type', () => {
    const { type, checker } = typeFromSource(
      'type T = { name: string; age: number };',
    );
    const result = serializeType(type, checker);
    expect(result).toContain('name: string');
    expect(result).toContain('age: number');
  });

  it('should serialize optional properties', () => {
    const { type, checker } = typeFromSource(
      'type T = { name: string; nick?: string };',
    );
    const result = serializeType(type, checker);
    expect(result).toContain('name: string');
    expect(result).toContain('nick?:');
  });

  it('should unwrap Promise', () => {
    const { type, checker } = typeFromSource('type T = Promise<string>;');
    expect(serializeType(type, checker)).toBe('string');
  });

  it('should handle nested objects', () => {
    const { type, checker } = typeFromSource(
      'type T = { user: { name: string } };',
    );
    const result = serializeType(type, checker);
    expect(result).toContain('user: { name: string }');
  });
});

describe('extractTypeReference', () => {
  it('should return importInfo for exported interface', () => {
    const { type, checker, fileName } = exportedInterfaceFromSource(
      'export interface MyBody { name: string; }',
      'MyBody',
    );
    const ref = extractTypeReference(type, checker);

    expect(ref.inlineType).toContain('name: string');
    expect(ref.importInfo).not.toBeNull();
    expect(ref.importInfo!.typeName).toBe('MyBody');
    expect(ref.importInfo!.sourceFilePath).toBe(fileName);
    expect(ref.importInfo!.isTypeOnly).toBe(true);
  });

  it('should return null importInfo for non-exported interface', () => {
    const { type, checker } = exportedInterfaceFromSource(
      'interface PrivateBody { secret: string; }',
      'PrivateBody',
    );
    const ref = extractTypeReference(type, checker);

    expect(ref.inlineType).toContain('secret: string');
    expect(ref.importInfo).toBeNull();
  });

  it('should return null importInfo for primitive types', () => {
    const { type, checker } = typeFromSource('type T = string;');
    const ref = extractTypeReference(type, checker);

    expect(ref.inlineType).toBe('string');
    expect(ref.importInfo).toBeNull();
  });

  it('should return null importInfo for built-in types like Array', () => {
    const { type, checker } = typeFromSource('type T = Array<string>;');
    const ref = extractTypeReference(type, checker);

    expect(ref.inlineType).toBe('string[]');
    expect(ref.importInfo).toBeNull();
  });

  it('should return null importInfo for anonymous object types', () => {
    const { type, checker } = typeFromSource(
      'type T = { foo: string; bar: number };',
    );
    const ref = extractTypeReference(type, checker);

    expect(ref.inlineType).toContain('foo: string');
    expect(ref.inlineType).toContain('bar: number');
    expect(ref.importInfo).toBeNull();
  });

  it('should return null importInfo for union types', () => {
    const { type, checker } = typeFromSource('type T = string | number;');
    const ref = extractTypeReference(type, checker);

    expect(ref.inlineType).toBe('string | number');
    expect(ref.importInfo).toBeNull();
  });

  it('should return importInfo for exported type alias with object structure', () => {
    const fileName = '/test-alias.ts';
    const source = 'export type UserData = { id: string; name: string };';
    const sourceFile = ts.createSourceFile(
      fileName,
      source,
      ts.ScriptTarget.Latest,
      true,
    );
    const host = ts.createCompilerHost({});
    const originalGetSourceFile = host.getSourceFile;
    host.getSourceFile = (name, ...args) => {
      if (name === fileName) return sourceFile;
      return originalGetSourceFile.call(host, name, ...args);
    };
    host.fileExists = (name) => name === fileName || ts.sys.fileExists(name);
    host.readFile = (name) =>
      name === fileName ? source : ts.sys.readFile(name);

    const program = ts.createProgram([fileName], { strict: true }, host);
    const checker = program.getTypeChecker();
    const sf = program.getSourceFile(fileName)!;

    let type: ts.Type | undefined;
    ts.forEachChild(sf, (node) => {
      if (ts.isTypeAliasDeclaration(node) && node.name.text === 'UserData') {
        type = checker.getTypeAtLocation(node);
      }
    });

    const ref = extractTypeReference(type!, checker);

    expect(ref.importInfo).not.toBeNull();
    expect(ref.importInfo!.typeName).toBe('UserData');
  });

  it('should return null importInfo for type alias to primitive', () => {
    // Type aliases to primitives resolve to the primitive itself
    const { type, checker } = typeFromSource('type T = string;');
    const ref = extractTypeReference(type, checker);

    // String is a primitive, so no import info
    expect(ref.inlineType).toBe('string');
    expect(ref.importInfo).toBeNull();
  });

  it('should unwrap Promise and return inner type reference', () => {
    const { type, checker } = typeFromSource('type T = Promise<string>;');
    const ref = extractTypeReference(type, checker);

    // Promise is unwrapped by serializeType, but extractTypeReference
    // captures the Promise type itself
    expect(ref.importInfo).toBeNull(); // Promise is a built-in
  });
});

describe('serializeType depth limiting', () => {
  it('should return unknown for excessively deep nested types', () => {
    // Create a deeply nested type that exceeds MAX_SERIALIZATION_DEPTH (15)
    const nestedType = Array.from({ length: 20 }, (_, i) => `L${i}`).reduce(
      (acc, name) => `{ ${name}: ${acc} }`,
      'string',
    );
    const { type, checker } = typeFromSource(`type T = ${nestedType};`);

    const result = serializeType(type, checker);

    // At some point in the deep nesting, it should return 'unknown'
    expect(result).toContain('unknown');
  });

  it('should serialize types within depth limit correctly', () => {
    // Create a moderately nested type (within MAX_SERIALIZATION_DEPTH)
    const { type, checker } = typeFromSource(
      'type T = { a: { b: { c: { d: string } } } };',
    );

    const result = serializeType(type, checker);

    expect(result).toContain('a:');
    expect(result).toContain('b:');
    expect(result).toContain('c:');
    expect(result).toContain('d: string');
    expect(result).not.toContain('unknown');
  });
});
