import { HonoAdapter } from '@dira/adapter-hono';
import { createApp } from './create-app';

const dira = createApp();
const port = parseInt(process.env.PORT || '3007', 10);
const adapter = new HonoAdapter();

await dira.run(adapter, { port });

console.log(`07-static-files (Hono) running at http://localhost:${adapter.port}`);
