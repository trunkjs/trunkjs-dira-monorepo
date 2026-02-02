import { join } from 'node:path';
import { DiraCore, errorHandlerMiddleware } from '@dira/core';
import { HonoAdapter } from '@dira/adapter-hono';
import { createStaticHandler } from '@dira/serve-static';
import { AppRequest } from './app-request';
import { timingMiddleware } from './middleware/timing-middleware';

const dira = new DiraCore()
  .use(
    errorHandlerMiddleware({
      includeStack: process.env.NODE_ENV !== 'production',
    }),
  )
  .use(timingMiddleware);

dira.setRequestClass(AppRequest);

// Discover and register API controllers
await dira.discover(join(import.meta.dirname, 'controllers'));

// Serve static files as catch-all (must be AFTER API routes)
dira.registerHandler(
  '/::path',
  createStaticHandler({
    root: join(import.meta.dirname, '../public'),
    cache: { maxAge: 3600 },
  }),
  { method: 'get', name: 'static' },
);

await dira.run(new HonoAdapter(), { port: 3004 });

console.log('04-full-app server running at http://localhost:3004');
console.log('Open http://localhost:3004 to see the demo page');
