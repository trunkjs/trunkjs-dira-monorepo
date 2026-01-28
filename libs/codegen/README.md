# @dira/codegen

Static code generation package that analyzes Dira controllers using the TypeScript Compiler API and generates a fully-typed client SDK.

## Usage

```typescript
import { generateClient } from '@dira/codegen';

const code = generateClient({
  controllerGlobs: ['./src/controllers'],
  tsconfig: './tsconfig.json',
  outFile: './src/generated/client.ts', // optional
});
```

The generated client provides a typed API:

```typescript
import { createClient } from './generated/client';

const api = createClient('http://localhost:3000');

// Typed body, query, params, and return type
const res = await api.posts.createPost.$post({
  body: { title: 'Hello', content: '...' },
});
const data = await res.json(); // typed as { id: string; title: string; ... }
```

## How it works

1. **File discovery** — `resolveFiles` accepts directories, file paths, or globs and collects `.ts` files (respecting `DiscoverOptions` from `@dira/dira-core`)
2. **AST analysis** — `analyzeControllers` creates a `ts.Program`, walks class declarations looking for `@DiraController` and `@DiraHttp` decorators, and extracts route, body, query, and return type metadata
3. **Code generation** — `generateClientCode` emits a self-contained `.ts` file with a `createClient(baseUrl)` factory that returns `api.controller.handler.$method(options)`

## Generated client shape

```
createClient(baseUrl)
  └─ controllerName
       └─ handlerName
            └─ $get / $post / $put / $patch / $delete
                 └─ (options?: { body?, query?, params?, headers? })
                      └─ Promise<TypedResponse<TReturn>>
```

- Path parameters are substituted from `params`
- Query parameters are serialized to the URL search string
- Body is JSON-serialized with `Content-Type: application/json`
- Return types are unwrapped from `Promise<T>` and `HandlerReturn<T>` unions

## Options

| Option            | Type               | Description                                       |
| ----------------- | ------------------ | ------------------------------------------------- |
| `controllerGlobs` | `string[]`         | Directories, file paths, or glob patterns         |
| `tsconfig`        | `string`           | Path to `tsconfig.json`                           |
| `outFile`         | `string?`          | If set, writes the generated code to this path    |
| `fileOptions`     | `DiscoverOptions?` | Override include/exclude extensions and recursion |

## Running tests

```bash
bunx nx run @dira/codegen:test
```
