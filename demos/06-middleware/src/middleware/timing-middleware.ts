import type { DiraMiddleware } from '@dira/core';

/**
 * Middleware that adds X-Response-Time header with request duration.
 * Demonstrates the onion model: code before next() runs on request,
 * code after next() runs on response.
 */
export const timingMiddleware: DiraMiddleware = async (_req, next) => {
  const start = performance.now();
  const response = await next();
  const duration = performance.now() - start;

  // Clone response and add timing header
  const headers = new Headers(response.headers);
  headers.set('X-Response-Time', `${duration.toFixed(2)}ms`);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
