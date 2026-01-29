import { readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { isController } from './dira-controller';
import {
  DEFAULT_DISCOVER_OPTIONS,
  type DiscoverOptions,
} from './discover-options';

/**
 * Scans a directory for TypeScript files and returns instances of classes decorated with @DiraController.
 * @param directory - Path to the directory containing controller files.
 * @param options - Optional configuration for file filtering.
 * @returns Array of instantiated controller objects.
 */
export async function discoverControllers(
  directory: string,
  options?: DiscoverOptions,
): Promise<object[]> {
  const include = options?.include ?? DEFAULT_DISCOVER_OPTIONS.include;
  const exclude = options?.exclude ?? DEFAULT_DISCOVER_OPTIONS.exclude;
  const recursive = options?.recursive ?? DEFAULT_DISCOVER_OPTIONS.recursive;

  const absolutePath = resolve(directory);
  const entries = await readdir(absolutePath, {
    withFileTypes: true,
    recursive,
  });

  const matchingFiles = entries
    .filter(
      (entry) =>
        entry.isFile() &&
        include.some((ext) => entry.name.endsWith(ext)) &&
        !exclude.some((ext) => entry.name.endsWith(ext)),
    )
    .map((entry) => join(entry.parentPath, entry.name));

  const controllers: object[] = [];

  for (const filePath of matchingFiles) {
    const module = await import(filePath);

    for (const exportedValue of Object.values(module)) {
      if (typeof exportedValue === 'function' && isController(exportedValue)) {
        const instance = new (exportedValue as new () => object)();
        controllers.push(instance);
      }
    }
  }

  return controllers;
}
