/**
 * Extracts path parameters from a URL by matching against a route pattern.
 * @param pattern - Route pattern with parameters (e.g., "/users/:id/posts/:postId")
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

    if (patternSegment.startsWith(':')) {
      const paramName = patternSegment.slice(1);
      if (pathSegment !== undefined) {
        params[paramName] = decodeURIComponent(pathSegment);
      }
    }
  }

  return params;
}
