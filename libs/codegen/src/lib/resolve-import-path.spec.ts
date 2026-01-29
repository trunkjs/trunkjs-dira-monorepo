import { describe, it, expect } from 'bun:test';
import { resolveImportPath } from './resolve-import-path';

describe('resolveImportPath', () => {
  describe('relative path resolution', () => {
    it('should compute relative path from output to source in same directory', () => {
      const result = resolveImportPath(
        '/project/src/types.ts',
        '/project/src/client.ts',
      );
      expect(result).toBe('./types');
    });

    it('should compute relative path from output to source in parent directory', () => {
      const result = resolveImportPath(
        '/project/src/types.ts',
        '/project/src/generated/client.ts',
      );
      expect(result).toBe('../types');
    });

    it('should compute relative path from output to source in sibling directory', () => {
      const result = resolveImportPath(
        '/project/src/controllers/user-controller.ts',
        '/project/src/generated/client.ts',
      );
      expect(result).toBe('../controllers/user-controller');
    });

    it('should compute relative path for deeply nested source', () => {
      const result = resolveImportPath(
        '/project/src/modules/users/types/user-body.ts',
        '/project/src/generated/client.ts',
      );
      expect(result).toBe('../modules/users/types/user-body');
    });

    it('should strip .ts extension from path', () => {
      const result = resolveImportPath(
        '/project/src/types.ts',
        '/project/src/client.ts',
      );
      expect(result).not.toContain('.ts');
    });

    it('should strip .tsx extension from path', () => {
      const result = resolveImportPath(
        '/project/src/component.tsx',
        '/project/src/client.ts',
      );
      expect(result).toBe('./component');
    });

    it('should ensure path starts with ./ for same directory', () => {
      const result = resolveImportPath(
        '/project/src/types.ts',
        '/project/src/client.ts',
      );
      expect(result.startsWith('./')).toBe(true);
    });

    it('should ensure path starts with ../ for parent directory', () => {
      const result = resolveImportPath(
        '/project/types.ts',
        '/project/src/client.ts',
      );
      expect(result.startsWith('../')).toBe(true);
    });
  });

  describe('path alias resolution', () => {
    it('should use path alias when source matches pattern', () => {
      const result = resolveImportPath(
        '/project/libs/shared/src/types.ts',
        '/project/apps/web/src/generated/client.ts',
        {
          paths: {
            '@shared/*': ['libs/shared/src/*'],
          },
          baseUrl: '.',
        },
        '/project',
      );
      expect(result).toBe('@shared/types');
    });

    it('should use path alias for nested paths', () => {
      const result = resolveImportPath(
        '/project/libs/shared/src/models/user.ts',
        '/project/apps/web/src/generated/client.ts',
        {
          paths: {
            '@shared/*': ['libs/shared/src/*'],
          },
          baseUrl: '.',
        },
        '/project',
      );
      expect(result).toBe('@shared/models/user');
    });

    it('should fall back to relative path when no alias matches', () => {
      const result = resolveImportPath(
        '/project/apps/web/src/controllers/user.ts',
        '/project/apps/web/src/generated/client.ts',
        {
          paths: {
            '@shared/*': ['libs/shared/src/*'],
          },
          baseUrl: '.',
        },
        '/project',
      );
      expect(result).toBe('../controllers/user');
    });

    it('should handle empty paths config', () => {
      const result = resolveImportPath(
        '/project/src/types.ts',
        '/project/src/generated/client.ts',
        {
          paths: {},
          baseUrl: '.',
        },
        '/project',
      );
      expect(result).toBe('../types');
    });

    it('should handle undefined compiler options', () => {
      const result = resolveImportPath(
        '/project/src/types.ts',
        '/project/src/generated/client.ts',
        undefined,
        undefined,
      );
      expect(result).toBe('../types');
    });
  });
});
