import { resolve } from 'node:path';
import { DiraCore } from '@dira/core';
import { createStaticHandler } from '@dira/serve-static';
import { ApiController } from './controllers/api-controller';

/**
 * Creates a Dira app configured with API routes and static file serving.
 * This is adapter-agnostic - the same app can run on Hono or Bun adapters.
 */
export function createApp(): DiraCore {
  const publicDir = resolve(import.meta.dirname, '../public');

  return new DiraCore()
    // Register API controller first (more specific routes)
    .registerController(new ApiController())
    // Serve static files as catch-all route (must be AFTER specific routes)
    .registerHandler(
      '/::path',
      createStaticHandler({
        root: publicDir,
        cache: {
          maxAge: 3600, // 1 hour
          etag: true,
          lastModified: true,
        },
      }),
      { method: 'get', name: 'static' },
    );
}
