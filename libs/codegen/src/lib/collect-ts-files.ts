import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_DISCOVER_OPTIONS, type DiscoverOptions } from '@dira/core';

/** Recursively collects TypeScript files from a directory, respecting include/exclude options. */
export function collectTsFiles(
  dir: string,
  options?: DiscoverOptions,
): string[] {
  const include = options?.include ?? DEFAULT_DISCOVER_OPTIONS.include;
  const exclude = options?.exclude ?? DEFAULT_DISCOVER_OPTIONS.exclude;
  const recursive = options?.recursive ?? DEFAULT_DISCOVER_OPTIONS.recursive;

  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (recursive) {
        results.push(...collectTsFiles(fullPath, options));
      }
    } else if (
      include.some((ext) => entry.name.endsWith(ext)) &&
      !exclude.some((ext) => entry.name.endsWith(ext))
    ) {
      results.push(fullPath);
    }
  }
  return results;
}
