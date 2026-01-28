import { describe, it, expect } from 'bun:test';
import ts from 'typescript';
import { serializeType } from './serialize-type';

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
