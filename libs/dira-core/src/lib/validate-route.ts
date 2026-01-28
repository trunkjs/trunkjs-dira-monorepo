/**
 * Validates a route pattern for correct syntax.
 * Throws an error if the route is invalid.
 * @param route - Route pattern to validate (e.g., "/files/::path")
 */
export function validateRoute(route: string): void {
  const segments = route.split('/').filter(Boolean);

  let wildcardFound = false;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const isWildcard = segment.startsWith('::');

    if (wildcardFound && isWildcard) {
      throw new Error(
        `Invalid route "${route}": wildcard parameter can only occur once per route.`,
      );
    }

    if (isWildcard) {
      wildcardFound = true;

      if (i !== segments.length - 1) {
        throw new Error(
          `Invalid route "${route}": wildcard parameter "::${segment.slice(2)}" must be at the end of the route.`,
        );
      }

      const paramName = segment.slice(2);
      if (!paramName) {
        throw new Error(
          `Invalid route "${route}": wildcard parameter must have a name (e.g., "::filePath").`,
        );
      }
    }
  }
}
