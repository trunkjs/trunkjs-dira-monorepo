import type { DiraMiddleware } from './middleware-types';
import { HttpError } from './http-error';

/** Options for the error handler middleware. */
export interface ErrorHandlerOptions {
  /** Whether to include stack traces in error responses. Default: false */
  includeStack?: boolean;
  /** Optional callback for logging/monitoring errors */
  onError?: (error: unknown) => void;
}

/**
 * Creates an error handling middleware that catches downstream errors
 * and converts them to proper HTTP error responses.
 *
 * @example
 * const dira = new DiraCore()
 *   .use(errorHandlerMiddleware({ includeStack: process.env.NODE_ENV !== 'production' }), { order: -100 });
 *
 * @param options - Configuration options
 * @returns Error handling middleware
 */
export function errorHandlerMiddleware(
  options?: ErrorHandlerOptions,
): DiraMiddleware {
  const { includeStack = false, onError } = options ?? {};

  return async (request, next) => {
    try {
      return await next();
    } catch (error) {
      // Call error callback if provided
      if (onError) {
        try {
          onError(error);
        } catch {
          // Ignore errors in error callback
        }
      }

      // Handle HttpError instances
      if (error instanceof HttpError) {
        const body: Record<string, unknown> = {
          error: error.message,
          status: error.status,
        };

        if (error.details) {
          body.details = error.details;
        }

        if (includeStack && error.stack) {
          body.stack = error.stack;
        }

        return new Response(JSON.stringify(body), {
          status: error.status,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Handle standard Error instances
      if (error instanceof Error) {
        const body: Record<string, unknown> = {
          error: error.message,
          status: 500,
        };

        if (includeStack && error.stack) {
          body.stack = error.stack;
        }

        return new Response(JSON.stringify(body), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Handle unknown error types
      const body: Record<string, unknown> = {
        error: 'Internal Server Error',
        status: 500,
      };

      return new Response(JSON.stringify(body), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}
