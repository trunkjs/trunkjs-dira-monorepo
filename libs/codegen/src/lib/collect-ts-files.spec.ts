import { describe, it, expect } from 'bun:test';
import { join } from 'node:path';
import { collectTsFiles } from './collect-ts-files';

const fixtureDir = join(import.meta.dirname, '__fixtures__/file-tree');

describe('collectTsFiles', () => {
  it('should collect .ts files', () => {
    const files = collectTsFiles(fixtureDir);
    const names = files.map((f) => f.split('/').pop());
    expect(names).toContain('alpha.ts');
  });

  it('should exclude .spec.ts files', () => {
    const files = collectTsFiles(fixtureDir);
    const names = files.map((f) => f.split('/').pop());
    expect(names).not.toContain('beta.spec.ts');
    expect(names).not.toContain('epsilon.spec.ts');
  });

  it('should exclude .test.ts files', () => {
    const files = collectTsFiles(fixtureDir);
    const names = files.map((f) => f.split('/').pop());
    expect(names).not.toContain('gamma.test.ts');
  });

  it('should exclude non-ts files', () => {
    const files = collectTsFiles(fixtureDir);
    const names = files.map((f) => f.split('/').pop());
    expect(names).not.toContain('readme.md');
  });

  it('should recurse into subdirectories', () => {
    const files = collectTsFiles(fixtureDir);
    const names = files.map((f) => f.split('/').pop());
    expect(names).toContain('delta.ts');
  });

  it('should return absolute paths', () => {
    const files = collectTsFiles(fixtureDir);
    for (const file of files) {
      expect(file.startsWith('/')).toBe(true);
    }
  });

  it('should return only alpha.ts and delta.ts from the fixture', () => {
    const files = collectTsFiles(fixtureDir);
    const names = files.map((f) => f.split('/').pop()).sort();
    expect(names).toEqual(['alpha.ts', 'delta.ts']);
  });

  it('should respect custom include extensions', () => {
    const files = collectTsFiles(fixtureDir, { include: ['.md'] });
    const names = files.map((f) => f.split('/').pop());
    expect(names).toEqual(['readme.md']);
  });

  it('should respect custom exclude extensions', () => {
    const files = collectTsFiles(fixtureDir, { exclude: [] });
    const names = files.map((f) => f.split('/').pop()).sort();
    expect(names).toContain('beta.spec.ts');
    expect(names).toContain('gamma.test.ts');
  });

  it('should skip subdirectories when recursive is false', () => {
    const files = collectTsFiles(fixtureDir, { recursive: false });
    const names = files.map((f) => f.split('/').pop()).sort();
    expect(names).toEqual(['alpha.ts']);
  });
});
