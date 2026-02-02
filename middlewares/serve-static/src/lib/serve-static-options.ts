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
  /** Enable directory listing when no index file exists. Default: false */
  directoryListing?: boolean;
  /** Cache configuration. */
  cache?: CacheOptions;
  /** Custom MIME type overrides by extension (e.g., { '.wasm': 'application/wasm' }). */
  mimeTypes?: Record<string, string>;
  /** Pass to next middleware if file not found. Default: true */
  fallthrough?: boolean;
}
