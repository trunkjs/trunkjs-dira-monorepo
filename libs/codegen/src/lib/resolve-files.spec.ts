import { describe, it, expect } from 'bun:test';
import { join } from 'node:path';
import { resolveFiles } from './resolve-files';

const fixtureDir = join(import.meta.dirname, '__fixtures__/file-tree');

describe('resolveFiles', () => {
  it('should resolve a directory to its .ts files', () => {
    const files = resolveFiles([fixtureDir]);
    const names = files.map((f) => f.split('/').pop()).sort();
    expect(names).toEqual(['alpha.ts', 'delta.ts']);
  });

  it('should resolve a single file path directly', () => {
    const filePath = join(fixtureDir, 'alpha.ts');
    const files = resolveFiles([filePath]);
    expect(files).toHaveLength(1);
    expect(files[0]).toEndWith('alpha.ts');
  });

  it('should handle multiple patterns', () => {
    const filePath = join(fixtureDir, 'alpha.ts');
    const files = resolveFiles([filePath, join(fixtureDir, 'sub')]);
    const names = files.map((f) => f.split('/').pop()).sort();
    expect(names).toEqual(['alpha.ts', 'delta.ts']);
  });

  it('should resolve glob patterns', () => {
    const pattern = join(fixtureDir, '*.ts');
    const files = resolveFiles([pattern]);
    const names = files.map((f) => f.split('/').pop()).sort();
    // Glob returns all .ts including spec/test — that's the glob's job, not resolveFiles' filtering
    expect(names.length).toBeGreaterThan(0);
    expect(names).toContain('alpha.ts');
  });

  it('should return empty array for empty input', () => {
    const files = resolveFiles([]);
    expect(files).toEqual([]);
  });
});
