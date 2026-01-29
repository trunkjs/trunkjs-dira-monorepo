/**
 * Extracts path parameters from a URL by matching against a route pattern.
 * Supports regular params (:param) and wildcard params (::param).
 * Wildcard params capture all remaining path segments.
 * @param pattern - Route pattern with parameters (e.g., "/users/:id" or "/files/::path")
 * @param url - The actual URL to extract parameters from
 * @returns Object with parameter names as keys and extracted values
 */
export function extractPathParams(
  pattern: string,
  url: string,
): Record<string, string> {
  const params: Record<string, string> = {};

  // Parse the URL to get the pathname
  const urlPath = new URL(url).pathname;

  // Split both pattern and path into segments
  const patternSegments = pattern.split('/').filter(Boolean);
  const pathSegments = urlPath.split('/').filter(Boolean);

  for (let i = 0; i < patternSegments.length; i++) {
    const patternSegment = patternSegments[i];
    const pathSegment = pathSegments[i];

    // Wildcard parameter (::paramName) - captures remaining path
    if (patternSegment.startsWith('::')) {
      const paramName = patternSegment.slice(2);
      const remainingSegments = pathSegments.slice(i);
      if (remainingSegments.length > 0) {
        // Join remaining segments and decode each one
        params[paramName] = remainingSegments
          .map((s) => decodeURIComponent(s))
          .join('/');
      }
      break; // Wildcard consumes rest of path
    }

    // Regular parameter (:paramName)
    if (patternSegment.startsWith(':')) {
      const paramName = patternSegment.slice(1);
      if (pathSegment !== undefined) {
        params[paramName] = decodeURIComponent(pathSegment);
      }
    }
  }

  return params;
}
