/**
 * HTTP error class for throwing typed errors in middleware and handlers.
 * Includes status code, message, and optional details for rich error responses.
 */
export class HttpError extends Error {
  constructor(
    /** HTTP status code (e.g., 400, 401, 404, 500) */
    public readonly status: number,
    /** Error message */
    message: string,
    /** Optional additional details for the error response */
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'HttpError';
    // Maintain proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HttpError);
    }
  }

  /** Converts the error to a JSON-serializable object. */
  toJSON(): {
    status: number;
    message: string;
    details?: Record<string, unknown>;
  } {
    return {
      status: this.status,
      message: this.message,
      ...(this.details && { details: this.details }),
    };
  }
}
