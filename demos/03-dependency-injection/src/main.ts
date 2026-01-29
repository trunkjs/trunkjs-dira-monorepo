import { join } from 'node:path';
import { DiraCore } from '@dira/core';
import { HonoAdapter } from '@dira/adapter-hono';
import { AppRequest } from './app-request';

const dira = new DiraCore();
dira.setRequestClass(AppRequest);

await dira.discover(join(import.meta.dirname, 'controllers'));
await dira.run(new HonoAdapter(), { port: 3003 });

console.log('03-dependency-injection server running at http://localhost:3003');
