import { join } from 'node:path';
import { DiraCore } from '@dira/core';
import { HonoAdapter } from '@dira/adapter-hono';

const dira = new DiraCore();
await dira.discover(join(import.meta.dirname, 'controllers'));
await dira.run(new HonoAdapter(), { port: 3002 });

console.log('02-http-features server running at http://localhost:3002');
