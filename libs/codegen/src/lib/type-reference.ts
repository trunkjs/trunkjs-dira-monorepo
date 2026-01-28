/**
 * Metadata for importing a type from its source file.
 */
export interface TypeImportInfo {
  /** The type name as it appears in the source file (e.g., "CreatePostBody") */
  typeName: string;
  /** Absolute path to the file where the type is declared */
  sourceFilePath: string;
  /** Whether to use `import type` syntax (always true for type-only imports) */
  isTypeOnly: boolean;
}

/**
 * Represents a type that may be importable or must be inlined.
 */
export interface TypeReference {
  /** Serialized type string (always available as fallback) */
  inlineType: string;
  /** Import metadata if the type can be imported, null otherwise */
  importInfo: TypeImportInfo | null;
}
