import { HonoAdapter } from '@dira/adapter-hono';
import { createApp } from './create-app';

// Default entry point uses Hono adapter
// Use main-hono.ts or main-bun.ts for explicit adapter selection

const dira = createApp();
const port = parseInt(process.env.PORT || '3007', 10);
const adapter = new HonoAdapter();

await dira.run(adapter, { port });

console.log(`Server running at http://localhost:${adapter.port}`);
console.log('Open in your browser to see the static files demo');
