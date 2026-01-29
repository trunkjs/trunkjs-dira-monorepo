/** Options for controller discovery. */
export interface DiscoverOptions {
  /** File extensions to include (e.g., ['.ts']). Defaults to ['.ts']. */
  include?: string[];
  /** File extensions to exclude (e.g., ['.spec.ts']). Defaults to ['.spec.ts', '.test.ts']. */
  exclude?: string[];
  /** Whether to scan subdirectories recursively. Defaults to true. */
  recursive?: boolean;
}

export const DEFAULT_DISCOVER_OPTIONS: Required<DiscoverOptions> = {
  include: ['.ts'],
  exclude: ['.spec.ts', '.test.ts'],
  recursive: true,
};
