import { statSync } from 'node:fs';
import { resolve } from 'node:path';
import type { DiscoverOptions } from '@dira/core';
import { collectTsFiles } from './collect-ts-files';

/**
 * Resolves an array of patterns (directories, file paths, or globs) into
 * absolute TypeScript file paths.
 */
export function resolveFiles(
  patterns: string[],
  fileOptions?: DiscoverOptions,
): string[] {
  const files: string[] = [];
  for (const pattern of patterns) {
    const resolved = resolve(pattern);
    try {
      const stat = statSync(resolved);
      if (stat.isDirectory()) {
        files.push(...collectTsFiles(resolved, fileOptions));
      } else {
        files.push(resolved);
      }
    } catch {
      const glob = new Bun.Glob(pattern);
      for (const file of glob.scanSync({ absolute: true })) {
        files.push(file);
      }
    }
  }
  return files;
}
