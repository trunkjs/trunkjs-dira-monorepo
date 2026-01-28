import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { CodegenOptions } from './codegen-options';
import { analyzeControllers } from './analyze-controllers';
import { generateClientCode } from './generate-client-code';
import { resolveFiles } from './resolve-files';

/**
 * Analyzes Dira controllers and generates a fully-typed client SDK as a string.
 * Optionally writes the output to `options.outFile`.
 */
export function generateClient(options: CodegenOptions): string {
  const files = resolveFiles(options.controllerGlobs, options.fileOptions);
  const routes = analyzeControllers(files, resolve(options.tsconfig));
  const code = generateClientCode(routes, { clientName: options.clientName });

  if (options.outFile) {
    writeFileSync(resolve(options.outFile), code, 'utf-8');
  }

  return code;
}
