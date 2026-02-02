/** Cache configuration for static file responses. */
export interface CacheOptions {
  /** Cache-Control max-age in seconds. Set to 0 to disable. */
  maxAge?: number;
  /** Generate and check ETags for conditional requests. Default: true */
  etag?: boolean;
  /** Send Last-Modified header and check If-Modified-Since. Default: true */
  lastModified?: boolean;
}

/** Options for the serve-static middleware. */
export interface ServeStaticOptions {
  /** Directory to serve files from (relative to cwd or absolute). */
  root: string;
  /** URL prefix to match before serving. Default: '/' */
  prefix?: string;
  /** Index files to serve for directory requests. Default: ['index.html'] */
  index?: string[];
  /** Cache configuration. */
  cache?: CacheOptions;
  /** Custom MIME type overrides by extension (e.g., { '.wasm': 'application/wasm' }). */
  mimeTypes?: Record<string, string>;
  /**
   * Pass to next middleware/handler if file not found.
   * - For `serveStatic` middleware: Default is `true` (pass to next handler)
   * - For `createStaticHandler`: Default is `false` (return 404 response)
   */
  fallthrough?: boolean;
}
