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
