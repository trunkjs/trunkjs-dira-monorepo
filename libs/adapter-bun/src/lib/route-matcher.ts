/**
 * Compiled route pattern for efficient matching.
 */
export interface CompiledRoute {
  /** Original pattern string (e.g., "/users/:id") */
  pattern: string;
  /** Regex for matching pathnames */
  regex: RegExp;
  /** Parameter names in order (e.g., ["id"]) */
  paramNames: string[];
}

/**
 * Result of a successful route match.
 */
export interface RouteMatch {
  matched: true;
  /** Extracted route parameters */
  params: Record<string, string>;
}

/**
 * Result of a failed route match.
 */
export interface RouteNoMatch {
  matched: false;
}

export type MatchResult = RouteMatch | RouteNoMatch;

/**
 * Compiles a route pattern into a regex for efficient matching.
 *
 * Supported patterns:
 * - Static: `/users` matches exactly `/users`
 * - Parameters: `/users/:id` matches `/users/123` with params `{ id: "123" }`
 * - Wildcards: `/files/*` matches `/files/path/to/file` with params `{ "*": "path/to/file" }`
 *
 * @param pattern Route pattern string
 * @returns Compiled route ready for matching
 */
export function compileRoute(pattern: string): CompiledRoute {
  const paramNames: string[] = [];
  let regexStr = '';
  let i = 0;

  while (i < pattern.length) {
    const char = pattern[i];

    if (char === ':') {
      // Named parameter - capture until next / or end
      let paramName = '';
      i++;
      while (i < pattern.length && pattern[i] !== '/') {
        paramName += pattern[i];
        i++;
      }
      paramNames.push(paramName);
      regexStr += '([^/]+)';
    } else if (char === '*') {
      // Wildcard - capture everything remaining
      paramNames.push('*');
      regexStr += '(.*)';
      i++;
    } else {
      // Literal character - escape regex special chars
      regexStr += escapeRegex(char);
      i++;
    }
  }

  return {
    pattern,
    regex: new RegExp(`^${regexStr}$`),
    paramNames,
  };
}

/**
 * Matches a pathname against a compiled route.
 *
 * @param compiled Pre-compiled route pattern
 * @param pathname URL pathname to match (e.g., "/users/123")
 * @returns Match result with extracted params, or no-match indicator
 */
export function matchRoute(
  compiled: CompiledRoute,
  pathname: string,
): MatchResult {
  const match = compiled.regex.exec(pathname);

  if (!match) {
    return { matched: false };
  }

  const params: Record<string, string> = {};
  for (let i = 0; i < compiled.paramNames.length; i++) {
    params[compiled.paramNames[i]] = match[i + 1];
  }

  return { matched: true, params };
}

/**
 * Escapes special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
