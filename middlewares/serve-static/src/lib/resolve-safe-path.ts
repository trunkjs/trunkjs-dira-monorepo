import { join, resolve, normalize, sep } from 'node:path';

/**
 * Resolves a request path to an absolute file path within the root directory.
 * Returns null if the resolved path would escape the root (path traversal attack).
 *
 * @param root - The absolute root directory path
 * @param requestPath - The URL path from the request (should start with /)
 * @returns Absolute file path if safe, null if path traversal detected
 */
export function resolveSafePath(
  root: string,
  requestPath: string,
): string | null {
  // Reject null bytes (could bypass checks in some systems)
  if (requestPath.includes('\0')) {
    return null;
  }

  // Decode URI components to handle encoded traversal attempts like %2e%2e%2f
  let decoded: string;
  try {
    decoded = decodeURIComponent(requestPath);
  } catch {
    // Invalid encoding
    return null;
  }

  // Double-check for null bytes after decoding
  if (decoded.includes('\0')) {
    return null;
  }

  // Normalize the root to an absolute path
  const normalizedRoot = resolve(root);

  // Remove leading slash and normalize the request path
  // This handles /../, /./,  and other traversal attempts
  const cleanPath = normalize(decoded.replace(/^\/+/, ''));

  // Use join to combine (doesn't escape root like resolve might)
  const absolutePath = join(normalizedRoot, cleanPath);

  // Critical security check: ensure the resolved path is within the root directory
  // Must either be exactly root or start with root + separator
  if (
    absolutePath !== normalizedRoot &&
    !absolutePath.startsWith(normalizedRoot + sep)
  ) {
    return null;
  }

  return absolutePath;
}
