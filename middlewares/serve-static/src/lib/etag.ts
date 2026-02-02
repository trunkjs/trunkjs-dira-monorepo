/**
 * Generate a weak ETag from file modification time and size.
 * Uses the format: W/"<mtime-hex>-<size-hex>"
 *
 * @param mtime - File modification time in milliseconds
 * @param size - File size in bytes
 * @returns ETag string in weak format
 */
export function generateEtag(mtime: number, size: number): string {
  const mtimeHex = Math.floor(mtime).toString(16);
  const sizeHex = size.toString(16);
  return `W/"${mtimeHex}-${sizeHex}"`;
}

/**
 * Check if the client's If-None-Match header matches the current ETag.
 *
 * @param ifNoneMatch - Value of the If-None-Match request header
 * @param etag - Current ETag of the resource
 * @returns true if any ETag matches (304 should be returned)
 */
export function isEtagMatch(ifNoneMatch: string | null, etag: string): boolean {
  if (!ifNoneMatch) {
    return false;
  }

  // Handle wildcard
  if (ifNoneMatch.trim() === '*') {
    return true;
  }

  // Parse comma-separated ETags and check for match
  // ETags can be weak (W/"...") or strong ("...")
  const tags = ifNoneMatch.split(',').map((tag) => tag.trim());

  for (const tag of tags) {
    // Compare weak ETags (ignore W/ prefix for comparison)
    const normalizedTag = tag.replace(/^W\//, '');
    const normalizedEtag = etag.replace(/^W\//, '');

    if (normalizedTag === normalizedEtag) {
      return true;
    }
  }

  return false;
}
