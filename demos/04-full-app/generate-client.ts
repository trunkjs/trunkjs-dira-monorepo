import { join } from 'node:path';
import { generateClient } from '@dira/codegen';

const rootDir = import.meta.dirname;

await generateClient({
  controllerGlobs: [join(rootDir, 'src/controllers')],
  tsconfig: join(rootDir, 'tsconfig.json'),
  outFile: join(rootDir, 'src/generated/client.ts'),
  clientName: 'FullAppClient',
  importTypes: true,
});

console.log('Client generated at src/generated/client.ts');
