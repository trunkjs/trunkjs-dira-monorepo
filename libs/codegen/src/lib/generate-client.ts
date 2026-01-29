import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import ts from 'typescript';
import type { CodegenOptions } from './codegen-options';
import { analyzeControllers } from './analyze-controllers';
import { generateClientCode } from './generate-client-code';
import { resolveFiles } from './resolve-files';

/**
 * Analyzes Dira controllers and generates a fully-typed client SDK as a string.
 * Optionally writes the output to `options.outFile`.
 */
export function generateClient(options: CodegenOptions): string {
  const tsconfigPath = resolve(options.tsconfig);
  const files = resolveFiles(options.controllerGlobs, options.fileOptions);

  // Parse tsconfig to get compiler options (needed for path alias resolution)
  const { compilerOptions, baseDir } = parseTsconfig(tsconfigPath);

  const routes = analyzeControllers(files, tsconfigPath, {
    extractRefs: options.importTypes,
  });

  const outputFilePath = options.outFile ? resolve(options.outFile) : undefined;

  const code = generateClientCode(routes, {
    clientName: options.clientName,
    useTypeImports: options.importTypes,
    outputFilePath,
    compilerOptions,
    baseDir,
  });

  if (options.outFile) {
    writeFileSync(resolve(options.outFile), code, 'utf-8');
  }

  return code;
}

/**
 * Parses a tsconfig.json file and returns compiler options with base directory.
 */
function parseTsconfig(tsconfigPath: string): {
  compilerOptions: ts.CompilerOptions;
  baseDir: string;
} {
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  const baseDir = dirname(tsconfigPath);
  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    baseDir,
  );

  return {
    compilerOptions: parsedConfig.options,
    baseDir,
  };
}
