import { describe, it, expect } from 'bun:test';
import { join } from 'node:path';
import { analyzeControllers } from './analyze-controllers';
import { generateClientCode } from './generate-client-code';

const fixturesDir = join(import.meta.dirname, '__fixtures__');
const tsconfigPath = join(
  import.meta.dirname,
  '../../../../tsconfig.base.json',
);

describe('analyzeControllers', () => {
  it('should extract routes from a controller with mixed patterns', () => {
    const routes = analyzeControllers(
      [join(fixturesDir, 'simple-controller.ts')],
      tsconfigPath,
    );

    expect(routes.length).toBe(7);

    const createItem = routes.find((r) => r.handlerName === 'createItem');
    expect(createItem).toBeDefined();
    expect(createItem!.controllerName).toBe('items');
    expect(createItem!.fullRoute).toBe('/items/create');
    expect(createItem!.httpMethods).toEqual(['POST']);
    expect(createItem!.bodyType).toContain('name');
    expect(createItem!.bodyType).toContain('value');
    expect(createItem!.returnType).toContain('id');

    const listItems = routes.find((r) => r.handlerName === 'listItems');
    expect(listItems).toBeDefined();
    expect(listItems!.httpMethods).toEqual(['GET']);
    expect(listItems!.bodyType).toBeNull();

    const getItem = routes.find((r) => r.handlerName === 'getItem');
    expect(getItem).toBeDefined();
    expect(getItem!.fullRoute).toBe('/items/:id');
    expect(getItem!.pathParams).toEqual(['id']);
    expect(getItem!.returnType).toContain('id');

    const updateItem = routes.find((r) => r.handlerName === 'updateItem');
    expect(updateItem).toBeDefined();
    expect(updateItem!.bodyType).toContain('name');
    expect(updateItem!.pathParams).toEqual(['id']);

    const search = routes.find((r) => r.handlerName === 'search');
    expect(search).toBeDefined();
    expect(search!.queryType).toContain('q');
    expect(search!.queryType).toContain('limit');

    const deleteItem = routes.find((r) => r.handlerName === 'deleteItem');
    expect(deleteItem).toBeDefined();
    expect(deleteItem!.httpMethods).toEqual(['DELETE']);

    const getStatus = routes.find((r) => r.handlerName === 'getStatus');
    expect(getStatus).toBeDefined();
    expect(getStatus!.handlerName).toBe('getStatus');
  });

  it('should use controller name from decorator options', () => {
    const routes = analyzeControllers(
      [join(fixturesDir, 'named-controller.ts')],
      tsconfigPath,
    );

    expect(routes.length).toBe(2);
    expect(routes[0].controllerName).toBe('admin.users');
    expect(routes[1].controllerName).toBe('admin.users');
  });

  it('should handle Response and void return types', () => {
    const routes = analyzeControllers(
      [join(fixturesDir, 'response-controller.ts')],
      tsconfigPath,
    );

    const download = routes.find((r) => r.handlerName === 'download');
    expect(download).toBeDefined();
    expect(download!.returnType).toBe('unknown');

    const nothing = routes.find((r) => r.handlerName === 'nothing');
    expect(nothing).toBeDefined();
    expect(nothing!.returnType).toBe('unknown');
  });
});

describe('generateClient (integration)', () => {
  it('should produce complete client code from fixture', () => {
    const routes = analyzeControllers(
      [join(fixturesDir, 'simple-controller.ts')],
      tsconfigPath,
    );
    const code = generateClientCode(routes);

    expect(code).toContain('createClient');
    expect(code).toContain('DiraClient');
    expect(code).toContain('items');
    expect(code).toContain('createItem');
    expect(code).toContain('$post');
    expect(code).toContain('$get');
    expect(code).toContain('$delete');
  });

  it('should create nested structure for dot-named controllers', () => {
    const routes = analyzeControllers(
      [join(fixturesDir, 'named-controller.ts')],
      tsconfigPath,
    );
    const code = generateClientCode(routes);

    expect(code).toContain('admin: {');
    expect(code).toContain('users: {');
  });
});

describe('analyzeControllers with extractRefs', () => {
  it('should extract type references when extractRefs is true', () => {
    const routes = analyzeControllers(
      [join(fixturesDir, 'exported-types-controller.ts')],
      tsconfigPath,
      { extractRefs: true },
    );

    const createUser = routes.find((r) => r.handlerName === 'createUser');
    expect(createUser).toBeDefined();
    expect(createUser!.bodyTypeRef).toBeDefined();
    expect(createUser!.bodyTypeRef!.importInfo).not.toBeNull();
    expect(createUser!.bodyTypeRef!.importInfo!.typeName).toBe(
      'CreateUserBody',
    );

    const updateUser = routes.find((r) => r.handlerName === 'updateUser');
    expect(updateUser).toBeDefined();
    expect(updateUser!.bodyTypeRef!.importInfo!.typeName).toBe(
      'UpdateUserBody',
    );
    expect(updateUser!.queryTypeRef!.importInfo!.typeName).toBe('UserQuery');
  });

  it('should return null importInfo for non-exported types', () => {
    const routes = analyzeControllers(
      [join(fixturesDir, 'exported-types-controller.ts')],
      tsconfigPath,
      { extractRefs: true },
    );

    const privateEndpoint = routes.find(
      (r) => r.handlerName === 'privateEndpoint',
    );
    expect(privateEndpoint).toBeDefined();
    expect(privateEndpoint!.bodyTypeRef).toBeDefined();
    expect(privateEndpoint!.bodyTypeRef!.importInfo).toBeNull();
    expect(privateEndpoint!.bodyTypeRef!.inlineType).toContain(
      'secret: string',
    );
  });

  it('should return null importInfo for anonymous inline types', () => {
    const routes = analyzeControllers(
      [join(fixturesDir, 'exported-types-controller.ts')],
      tsconfigPath,
      { extractRefs: true },
    );

    const inlineEndpoint = routes.find(
      (r) => r.handlerName === 'inlineEndpoint',
    );
    expect(inlineEndpoint).toBeDefined();
    expect(inlineEndpoint!.bodyTypeRef).toBeDefined();
    expect(inlineEndpoint!.bodyTypeRef!.importInfo).toBeNull();
    expect(inlineEndpoint!.bodyTypeRef!.inlineType).toContain('foo: string');
  });

  it('should not populate type refs when extractRefs is false', () => {
    const routes = analyzeControllers(
      [join(fixturesDir, 'exported-types-controller.ts')],
      tsconfigPath,
      { extractRefs: false },
    );

    const createUser = routes.find((r) => r.handlerName === 'createUser');
    expect(createUser).toBeDefined();
    expect(createUser!.bodyTypeRef).toBeUndefined();
  });
});

describe('generateClientCode with type imports', () => {
  it('should generate import statements when useTypeImports is true', () => {
    const routes = analyzeControllers(
      [join(fixturesDir, 'exported-types-controller.ts')],
      tsconfigPath,
      { extractRefs: true },
    );

    const code = generateClientCode(routes, {
      useTypeImports: true,
      outputFilePath: join(fixturesDir, '../generated/client.ts'),
    });

    expect(code).toContain('import type {');
    expect(code).toContain('CreateUserBody');
    expect(code).toContain('UpdateUserBody');
    expect(code).toContain('UserQuery');
    expect(code).toContain("from '../__fixtures__/exported-types-controller'");
  });

  it('should use imported type names in method signatures', () => {
    const routes = analyzeControllers(
      [join(fixturesDir, 'exported-types-controller.ts')],
      tsconfigPath,
      { extractRefs: true },
    );

    const code = generateClientCode(routes, {
      useTypeImports: true,
      outputFilePath: join(fixturesDir, '../generated/client.ts'),
    });

    // Check that imported type names are used instead of inline types
    expect(code).toContain('body: CreateUserBody');
    expect(code).toContain('body: UpdateUserBody');
    expect(code).toContain('query: UserQuery');
  });

  it('should fall back to inline types for non-exported types', () => {
    const routes = analyzeControllers(
      [join(fixturesDir, 'exported-types-controller.ts')],
      tsconfigPath,
      { extractRefs: true },
    );

    const code = generateClientCode(routes, {
      useTypeImports: true,
      outputFilePath: join(fixturesDir, '../generated/client.ts'),
    });

    // Private types should be inlined, not imported
    expect(code).not.toContain('PrivateBody');
    expect(code).toContain('secret: string');
  });

  it('should not generate imports when useTypeImports is false', () => {
    const routes = analyzeControllers(
      [join(fixturesDir, 'exported-types-controller.ts')],
      tsconfigPath,
      { extractRefs: true },
    );

    const code = generateClientCode(routes, {
      useTypeImports: false,
      outputFilePath: join(fixturesDir, '../generated/client.ts'),
    });

    expect(code).not.toContain('import type {');
    expect(code).toContain('name: string');
    expect(code).toContain('email: string');
  });

  it('should not generate imports when outputFilePath is not provided', () => {
    const routes = analyzeControllers(
      [join(fixturesDir, 'exported-types-controller.ts')],
      tsconfigPath,
      { extractRefs: true },
    );

    const code = generateClientCode(routes, {
      useTypeImports: true,
      // outputFilePath intentionally omitted
    });

    expect(code).not.toContain('import type {');
  });

  it('should deduplicate imports from the same source file', () => {
    const routes = analyzeControllers(
      [join(fixturesDir, 'exported-types-controller.ts')],
      tsconfigPath,
      { extractRefs: true },
    );

    const code = generateClientCode(routes, {
      useTypeImports: true,
      outputFilePath: join(fixturesDir, '../generated/client.ts'),
    });

    // Count occurrences of import statement - should only be one
    const importCount = (
      code.match(/from '\.\.\/__fixtures__\/exported-types-controller'/g) || []
    ).length;
    expect(importCount).toBe(1);

    // But multiple types should be in the same import
    expect(code).toMatch(
      /import type \{[^}]*CreateUserBody[^}]*UpdateUserBody[^}]*}/,
    );
  });

  it('should sort imported type names alphabetically', () => {
    const routes = analyzeControllers(
      [join(fixturesDir, 'exported-types-controller.ts')],
      tsconfigPath,
      { extractRefs: true },
    );

    const code = generateClientCode(routes, {
      useTypeImports: true,
      outputFilePath: join(fixturesDir, '../generated/client.ts'),
    });

    // Extract the import statement
    const importMatch = code.match(/import type \{ ([^}]+) }/);
    expect(importMatch).not.toBeNull();

    const importedTypes = importMatch![1].split(', ');
    const sortedTypes = [...importedTypes].sort();
    expect(importedTypes).toEqual(sortedTypes);
  });

  it('should use path aliases when compiler options are provided', () => {
    const routes = analyzeControllers(
      [join(fixturesDir, 'exported-types-controller.ts')],
      tsconfigPath,
      { extractRefs: true },
    );

    const code = generateClientCode(routes, {
      useTypeImports: true,
      outputFilePath: '/project/apps/web/src/generated/client.ts',
      compilerOptions: {
        paths: {
          '@fixtures/*': [join(fixturesDir, '*')],
        },
        baseUrl: '.',
      },
      baseDir: '/',
    });

    // Should use the alias if it matches
    expect(code).toContain('import type {');
  });
});
