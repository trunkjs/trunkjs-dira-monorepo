import { BunAdapter } from '@dira/adapter-bun';
import { createApp } from './create-app';

const dira = createApp();
await dira.run(new BunAdapter(), { port: 3006 });

console.log('05-adapter-agnostic (Bun) running at http://localhost:3006');
