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

### Custom fetch implementation

You can provide a custom `fetch` implementation via the `options` parameter. This is useful for testing, adding interceptors, or using libraries like `node-fetch`:

```typescript
import { createClient } from './generated/client';

// Use a custom fetch (e.g., for testing with mocks)
const api = createClient('http://localhost:3000', {
  fetch: myCustomFetch,
});
```

### Accessing route metadata

The client exposes route metadata for cases where you need access to the underlying URL patterns:

```typescript
import { createClient } from './generated/client';

const api = createClient('http://localhost:3000');

// Access individual route metadata via $route
const route = api.users.getUser.$route;
// { path: '/users/:id', methods: ['GET'] }

// Access all routes via $routes
console.log(api.$routes);
// {
//   'posts.createPost': { path: '/posts/create', methods: ['POST'] },
//   'users.getUser': { path: '/users/:id', methods: ['GET'] },
//   ...
// }
```

## How it works

1. **File discovery** — `resolveFiles` accepts directories, file paths, or globs and collects `.ts` files (respecting `DiscoverOptions` from `@dira/dira-core`)
2. **AST analysis** — `analyzeControllers` creates a `ts.Program`, walks class declarations looking for `@DiraController` and `@DiraHttp` decorators, and extracts route, body, query, and return type metadata
3. **Code generation** — `generateClientCode` emits a self-contained `.ts` file with a `createClient(baseUrl)` factory that returns `api.controller.handler.$method(options)`

## Generated client shape

```
createClient(baseUrl, options?)
  └─ controllerName
       └─ handlerName
            └─ $get / $post / $put / $patch / $delete
                 └─ (options?: { body?, query?, params?, headers? })
                      └─ Promise<TypedResponse<TReturn>>
```

The `options` parameter accepts:

- `fetch?: typeof fetch` — Custom fetch implementation (defaults to global `fetch`)

- Path parameters are substituted from `params`
- Query parameters are serialized to the URL search string
- Body is JSON-serialized with `Content-Type: application/json`
- Return types are unwrapped from `Promise<T>` and `HandlerReturn<T>` unions

## Options

| Option            | Type               | Description                                                                  |
| ----------------- | ------------------ | ---------------------------------------------------------------------------- |
| `controllerGlobs` | `string[]`         | Directories, file paths, or glob patterns                                    |
| `tsconfig`        | `string`           | Path to `tsconfig.json`                                                      |
| `outFile`         | `string?`          | If set, writes the generated code to this path                               |
| `fileOptions`     | `DiscoverOptions?` | Override include/exclude extensions and recursion                            |
| `clientName`      | `string?`          | Name for the generated client interface (defaults to DiraClient)             |
| `importTypes`     | `boolean?`         | Import named types instead of inlining their structure (defaults to `false`) |

### Importing types instead of inlining

By default, the generated client inlines all type structures. With `importTypes: true`, the generator imports named, exported types from their source files instead:

```typescript
// Controller defines an exported interface
export interface CreatePostBody {
  title: string;
  content: string;
}

@DiraController('/posts')
export class PostsController {
  @DiraHttp('/create', { method: 'POST' })
  async createPost(req: DiraRequest<CreatePostBody>) {
    // ...
  }
}
```

```typescript
// Generate with type imports enabled
generateClient({
  controllerGlobs: ['./src/controllers'],
  tsconfig: './tsconfig.json',
  outFile: './src/generated/client.ts',
  importTypes: true,
});
```

The generated client will import the type:

```typescript
// Generated client.ts
import type { CreatePostBody } from '../controllers/posts-controller';

// Method signature uses the imported type
$post(options: { body: CreatePostBody; headers?: HeadersInit }): Promise<TypedResponse<...>>;
```

**Benefits:**

- IDE "go-to-definition" navigates to the original interface
- Reduced duplication when types are shared across controllers
- Better DX in monorepo scenarios

**Fallback behavior:**

- Non-exported types are inlined (no import possible)
- Anonymous inline types (`{ foo: string }`) are inlined
- Built-in types (`string`, `Array`, etc.) are never imported
- Types from `node_modules` or `.d.ts` files are excluded

**Path alias support:**
The generator respects `paths` mappings from your `tsconfig.json`. If a type's source file matches a path alias pattern, the import will use the alias instead of a relative path.

### Using multiple API clients

When consuming multiple APIs, use `clientName` to generate distinct client interfaces:

```typescript
// Generate clients for different APIs
generateClient({
  controllerGlobs: ['./api-users/controllers'],
  tsconfig: './tsconfig.json',
  outFile: './generated/users-client.ts',
  clientName: 'UsersApiClient',
});

generateClient({
  controllerGlobs: ['./api-orders/controllers'],
  tsconfig: './tsconfig.json',
  outFile: './generated/orders-client.ts',
  clientName: 'OrdersApiClient',
});
```

```typescript
// Use both clients in the same application
import { createClient as createUsersClient } from './generated/users-client';
import { createClient as createOrdersClient } from './generated/orders-client';

const usersApi = createUsersClient('https://users.example.com');
const ordersApi = createOrdersClient('https://orders.example.com');
```

## Running tests

```bash
bunx nx run @dira/codegen:test
```
