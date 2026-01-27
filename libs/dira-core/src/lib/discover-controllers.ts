import 'reflect-metadata';
import { readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { CONTROLLER_PREFIX } from './dira-controller';
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

  const absolutePath = resolve(directory);
  const files = await readdir(absolutePath);
  const matchingFiles = files.filter(
    (file) =>
      include.some((ext) => file.endsWith(ext)) &&
      !exclude.some((ext) => file.endsWith(ext)),
  );

  const controllers: object[] = [];

  for (const file of matchingFiles) {
    const filePath = join(absolutePath, file);
    const module = await import(filePath);

    for (const exportedValue of Object.values(module)) {
      if (
        typeof exportedValue === 'function' &&
        Reflect.hasMetadata(CONTROLLER_PREFIX, exportedValue)
      ) {
        const instance = new (exportedValue as new () => object)();
        controllers.push(instance);
      }
    }
  }

  return controllers;
}
