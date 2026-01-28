import { join } from 'node:path';
import { generateClient } from '@dira/codegen';

const code = generateClient({
  controllerGlobs: [join(import.meta.dirname, 'src/controllers')],
  tsconfig: join(import.meta.dirname, '../../tsconfig.base.json'),
  outFile: join(import.meta.dirname, 'src/generated/client.ts'),
  importTypes: true,
});

console.log('Client generated successfully.');
console.log(`Output: src/generated/client.ts (${code.length} bytes)`);
