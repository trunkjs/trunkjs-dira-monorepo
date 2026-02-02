import { resolve } from 'node:path';
import { DiraCore } from '@dira/core';
import { HonoAdapter } from '@dira/adapter-hono';
import { createStaticHandler } from '@dira/serve-static';
import { ApiController } from './controllers/api-controller';

// Create and configure the Dira app
const dira = new DiraCore()
  // Register API controller first (more specific routes)
  .registerController(new ApiController())
  // Serve static files as catch-all route (must be AFTER specific routes)
  .registerHandler(
    '/::path',
    createStaticHandler({
      root: resolve(import.meta.dirname, '../public'),
      cache: {
        maxAge: 3600, // 1 hour
        etag: true,
        lastModified: true,
      },
    }),
    { method: 'get', name: 'static' },
  );

// Start server (use PORT env var or default to 3007)
const port = parseInt(process.env.PORT || '3007', 10);
const adapter = new HonoAdapter();
await dira.run(adapter, { port });

console.log(`Server running at http://localhost:${adapter.port}`);
console.log('Open in your browser to see the static files demo');
