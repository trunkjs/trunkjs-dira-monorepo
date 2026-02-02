import type { DiraMiddleware } from '@dira/core';

/** Context added by logging middleware. */
export interface LogContext {
  requestId: string;
}

/**
 * Logging middleware that adds request ID and logs requests.
 * Demonstrates context sharing between middleware.
 */
export const loggingMiddleware: DiraMiddleware<
  Record<string, never>,
  LogContext
> = async (req, next) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  req.ctx.requestId = requestId;

  const start = Date.now();
  console.log(`[${requestId}] ${req.method} ${req.url}`);

  try {
    const response = await next();
    const duration = Date.now() - start;
    console.log(`[${requestId}] ${response.status} (${duration}ms)`);
    return response;
  } catch (error) {
    const duration = Date.now() - start;
    console.log(`[${requestId}] ERROR (${duration}ms):`, error);
    throw error;
  }
};
