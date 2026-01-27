import { join } from 'node:path';
import { DiraCore } from '@dira/dira-core';
import { HonoAdapter } from '@dira/adapter-hono';

const dira = new DiraCore();

await dira.discover(join(import.meta.dirname, 'controllers'));

await dira.run(new HonoAdapter(), { port: 3000 });
