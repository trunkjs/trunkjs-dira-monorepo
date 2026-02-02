import { join } from 'node:path';
import { DiraCore, errorHandlerMiddleware } from '@dira/core';
import { HonoAdapter } from '@dira/adapter-hono';
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

await dira.discover(join(import.meta.dirname, 'controllers'));
await dira.run(new HonoAdapter(), { port: 3004 });

console.log('04-full-app server running at http://localhost:3004');
