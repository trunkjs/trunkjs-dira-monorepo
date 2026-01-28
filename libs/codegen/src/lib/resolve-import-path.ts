import { relative, dirname, resolve, posix } from 'node:path';
import ts from 'typescript';

/**
 * Resolves the import path from an output file to a source file.
 * Uses tsconfig path aliases if available, otherwise computes a relative path.
 */
export function resolveImportPath(
  sourceFilePath: string,
  outputFilePath: string,
  compilerOptions?: ts.CompilerOptions,
  baseDir?: string,
): string {
  // Try to match against tsconfig paths first
  if (compilerOptions?.paths && baseDir) {
    const aliasedPath = tryMatchPathAlias(
      sourceFilePath,
      compilerOptions.paths,
      compilerOptions.baseUrl ?? baseDir,
      baseDir,
    );
    if (aliasedPath) {
      return aliasedPath;
    }
  }

  // Fall back to relative path
  return computeRelativePath(sourceFilePath, outputFilePath);
}

/**
 * Attempts to match a source file against tsconfig path patterns.
 * Returns the aliased import path if a match is found, null otherwise.
 */
function tryMatchPathAlias(
  sourceFilePath: string,
  paths: ts.MapLike<string[]>,
  baseUrl: string,
  baseDir: string,
): string | null {
  const resolvedBaseUrl = resolve(baseDir, baseUrl);
  const absoluteSourcePath = resolve(sourceFilePath);

  for (const [pattern, mappings] of Object.entries(paths)) {
    if (!mappings || mappings.length === 0) continue;

    // Convert path pattern to regex
    // e.g., "@dira/*" -> /^@dira\/(.*)$/
    const patternRegex = pattern.replace(/\*/g, '(.*)');
    const escapedPattern = patternRegex.replace(/[/]/g, '\\/');

    for (const mapping of mappings) {
      // Resolve the mapping path
      const mappingDir = resolve(resolvedBaseUrl, mapping.replace(/\*$/, ''));

      // Check if the source file is within this mapped directory
      if (absoluteSourcePath.startsWith(mappingDir)) {
        let relativePart = absoluteSourcePath.slice(mappingDir.length);
        // Remove leading slash if present
        if (relativePart.startsWith('/')) {
          relativePart = relativePart.slice(1);
        }
        // Reconstruct the aliased path
        const aliasBase = pattern.replace(/\*$/, '');
        const importPath = aliasBase + stripExtension(relativePart);
        return importPath;
      }
    }
  }

  return null;
}

/**
 * Computes a relative import path from the output file to the source file.
 */
function computeRelativePath(
  sourceFilePath: string,
  outputFilePath: string,
): string {
  const outputDir = dirname(resolve(outputFilePath));
  const sourceAbsolute = resolve(sourceFilePath);

  let relativePath = relative(outputDir, sourceAbsolute);

  // Convert to POSIX-style path separators for imports
  relativePath = relativePath.split('\\').join('/');

  // Strip .ts extension
  relativePath = stripExtension(relativePath);

  // Ensure relative path starts with ./ or ../
  if (!relativePath.startsWith('.') && !relativePath.startsWith('/')) {
    relativePath = './' + relativePath;
  }

  return relativePath;
}

/**
 * Strips .ts or .tsx extension from a path.
 */
function stripExtension(filePath: string): string {
  return filePath.replace(/\.tsx?$/, '');
}
