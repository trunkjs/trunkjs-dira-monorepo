import { BunAdapter } from '@dira/adapter-bun';
import { createApp } from './create-app';

const dira = createApp();
const port = parseInt(process.env.PORT || '3008', 10);
const adapter = new BunAdapter();

await dira.run(adapter, { port });

console.log(`07-static-files (Bun) running at http://localhost:${adapter.port}`);
