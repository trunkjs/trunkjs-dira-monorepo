import { HonoAdapter } from '@dira/adapter-hono';
import { createApp } from './create-app';

const dira = createApp();
await dira.run(new HonoAdapter(), { port: 3005 });

console.log('05-adapter-agnostic (Hono) running at http://localhost:3005');
