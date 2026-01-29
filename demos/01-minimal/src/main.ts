import { DiraCore } from '@dira/core';
import { HonoAdapter } from '@dira/adapter-hono';
import { HelloController } from './hello-controller';

const dira = new DiraCore();
dira.registerController(new HelloController());
await dira.run(new HonoAdapter(), { port: 3001 });

console.log('01-minimal server running at http://localhost:3001');
