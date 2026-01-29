import { join } from 'node:path';
import { DiraCore, errorHandlerMiddleware } from '@dira/core';
import { HonoAdapter, type HonoMiddleware } from '@dira/adapter-hono';
import { timingMiddleware } from './middleware/timing-middleware';
import { loggingMiddleware } from './middleware/logging-middleware';

/**
 * Middleware Demo Application
 *
 * Demonstrates the Dira middleware system:
 * - Global middleware: error handling, timing, logging
 * - Controller-level middleware: authentication
 * - Method-level middleware: role-based authorization
 * - Typed context: AuthContext, LogContext
 * - Onion model: timing middleware wraps entire request
 * - Adapter middleware bridging: using native Hono middleware with Dira
 *
 * Try these endpoints:
 *
 * Public (no auth):
 *   GET  /health              - Health check
 *   POST /echo                - Echo request body
 *
 * Authenticated (need Bearer token):
 *   GET /api/me               - Get current user info
 *   GET /api/admin/stats      - Admin-only stats (need admin-token)
 *
 * Example requests:
 *   curl http://localhost:3006/health
 *   curl http://localhost:3006/api/me -H "Authorization: Bearer user-token"
 *   curl http://localhost:3006/api/admin/stats -H "Authorization: Bearer admin-token"
 */

// Create the adapter first to access its middleware bridge
const adapter = new HonoAdapter();

// Example: Using native Hono middleware via the adapter bridge
// This demonstrates how to use Hono ecosystem middleware (cors, compress, etc.)
const honoRequestLogger: HonoMiddleware = async (c, next) => {
  console.log(`[Hono] ${c.req.method} ${c.req.url}`);
  await next();
};

const dira = new DiraCore()
  // Error handler first - catches all downstream errors
  .use(
    errorHandlerMiddleware({
      includeStack: process.env.NODE_ENV !== 'production',
    }),
  )
  // Timing middleware wraps everything
  .use(timingMiddleware)
  // Logging middleware adds request ID
  .use(loggingMiddleware)
  // Native Hono middleware bridged to Dira
  .use(adapter.middlewareBridge.bridge(honoRequestLogger));

await dira.discover(join(import.meta.dirname, 'controllers'));
await dira.run(adapter, { port: 3006 });

console.log('06-middleware server running at http://localhost:3006');
console.log('\nTry:');
console.log('  curl http://localhost:3006/health');
console.log(
  '  curl http://localhost:3006/api/me -H "Authorization: Bearer user-token"',
);
console.log(
  '  curl http://localhost:3006/api/admin/stats -H "Authorization: Bearer admin-token"',
);
