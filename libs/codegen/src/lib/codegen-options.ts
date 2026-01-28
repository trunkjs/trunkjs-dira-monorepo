import type { DiscoverOptions } from '@dira/dira-core';

export interface CodegenOptions {
  /** Glob patterns or directory paths containing controller files. */
  controllerGlobs: string[];
  /** Path to tsconfig.json to use for type resolution. */
  tsconfig: string;
  /** Output file path for the generated client. If omitted, code is only returned as a string. */
  outFile?: string;
  /** File discovery options (include/exclude extensions, recursive). Uses dira-core defaults if omitted. */
  fileOptions?: DiscoverOptions;
}
