/**
 * Regex pattern for valid route names.
 * Allows alphanumeric characters, dots (.) as segment separators, and hyphens (-) within segments.
 * Examples: "api.users.get", "api.users.get-by-id"
 */
const ROUTE_NAME_PATTERN = /^[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*$/;

/**
 * Validates that a route name follows the dot-naming convention.
 * Valid: alphanumeric characters, dots, and hyphens. No whitespace or special characters.
 * @param name - The route name to validate.
 * @throws Error if the name is invalid.
 */
export function validateRouteName(name: string): void {
  if (!ROUTE_NAME_PATTERN.test(name)) {
    throw new Error(
      `Invalid route name "${name}". Names must contain only alphanumeric characters, dots (.), and hyphens (-). ` +
        `Must start with alphanumeric. Examples: "api.users.get", "api.users.get-by-id"`,
    );
  }
}
