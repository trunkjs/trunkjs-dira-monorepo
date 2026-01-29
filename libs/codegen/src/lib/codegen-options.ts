import type { DiscoverOptions } from '@dira/core';

export interface CodegenOptions {
  /** Glob patterns or directory paths containing controller files. */
  controllerGlobs: string[];
  /** Path to tsconfig.json to use for type resolution. */
  tsconfig: string;
  /** Output file path for the generated client. If omitted, code is only returned as a string. */
  outFile?: string;
  /** File discovery options (include/exclude extensions, recursive). Uses dira-core defaults if omitted. */
  fileOptions?: DiscoverOptions;
  /** Name for the generated client interface (e.g., "MyApiClient"). Defaults to "DiraClient". */
  clientName?: string;
  /**
   * When enabled, imports named types instead of inlining their structure.
   * Only works for types that are named and exported from their source file.
   * Falls back to inline for anonymous or non-exported types.
   * @default false
   */
  importTypes?: boolean;
}
