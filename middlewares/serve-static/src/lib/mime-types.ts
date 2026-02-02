import { extname } from 'node:path';

/** Default MIME types for common file extensions. */
const DEFAULT_MIME_TYPES: Record<string, string> = {
  // Text
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',

  // Images
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',

  // Fonts
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',

  // Audio/Video
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',

  // Documents
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.gz': 'application/gzip',
  '.tar': 'application/x-tar',

  // Web
  '.wasm': 'application/wasm',
  '.map': 'application/json',
  '.webmanifest': 'application/manifest+json',
};

/**
 * Get the MIME type for a file based on its extension.
 *
 * @param filePath - The file path to get the MIME type for
 * @param customTypes - Optional custom MIME type overrides
 * @returns The MIME type string, or 'application/octet-stream' for unknown types
 */
export function getMimeType(
  filePath: string,
  customTypes?: Record<string, string>,
): string {
  const ext = extname(filePath).toLowerCase();

  // Check custom types first
  if (customTypes && ext in customTypes) {
    return customTypes[ext];
  }

  // Fall back to defaults
  return DEFAULT_MIME_TYPES[ext] ?? 'application/octet-stream';
}
