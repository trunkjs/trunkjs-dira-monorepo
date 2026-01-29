/**
 * Base error class for all Dira framework errors.
 * Use this for framework-specific error cases such as:
 * - Invalid decorator usage
 * - Configuration errors
 * - Missing dependencies
 * - Invalid route patterns
 */
export class DiraError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DiraError';
    // Maintains proper stack trace for where error was thrown (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DiraError);
    }
  }
}
