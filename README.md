# Dira

A decorator-based HTTP framework for Bun with an adapter pattern for flexibility, built-in dependency injection, and a powerful middleware system.

## Features

- **Decorator-based routing** - Use `@DiraController` and `@DiraHttp` for clean, declarative route definitions
- **Adapter pattern** - Swap HTTP implementations (Hono, native Bun) without changing application code
- **Dependency injection** - Request-scoped DI container with `@Injectable`, `@Inject`, and `@Cached` decorators
- **Middleware system** - Global, controller, and method-level middleware with onion model execution
- **Type-safe client SDK** - Generate fully-typed API clients from your controllers at build time
- **TypeScript-first** - Full type inference for routes, parameters, bodies, and responses

## Quick Start

```bash
bun install
bun run --cwd demos/01-minimal start
```

```typescript
import { DiraCore, DiraController, DiraHttp, DiraHttpRequest } from '@dira/core';
import { HonoAdapter } from '@dira/adapter-hono';

@DiraController('/api')
class HelloController {
  @DiraHttp('/hello')
  hello(req: DiraHttpRequest) {
    return { message: 'Hello, World!' };
  }
}

const dira = new DiraCore();
dira.registerController(new HelloController());
dira.run(new HonoAdapter());
```

## Architecture

```mermaid
graph TB
    subgraph "Application Layer"
        C[Controllers<br/>@DiraController + @DiraHttp]
        M[Middleware<br/>@UseMiddleware]
        S[Services<br/>@Injectable + @Inject]
    end

    subgraph "@dira/core"
        DC[DiraCore]
        DR[Route Registry]
        MW[Middleware Pipeline]
        REQ[DiraHttpRequest]
    end

    subgraph "@dira/di"
        DI[DiContainer]
        INJ[@Injectable / @Inject]
        CACHE[@Cached]
    end

    subgraph "Adapters"
        AH["@dira/adapter-hono<br/>(Hono + Bun.serve)"]
        AB["@dira/adapter-bun<br/>(Native Bun.serve)"]
    end

    subgraph "@dira/codegen"
        AST[TypeScript AST Analysis]
        GEN[Client SDK Generator]
    end

    C --> DC
    M --> MW
    S --> DI

    DC --> DR
    DR --> MW
    MW --> REQ
    REQ --> DI

    DC --> AH
    DC --> AB

    C -.-> AST
    AST --> GEN
    GEN -.-> |"Generated Client"| CLIENT[api.controller.method.$get]

    style C fill:#e1f5fe
    style M fill:#fff3e0
    style S fill:#f3e5f5
    style DC fill:#c8e6c9
    style DI fill:#f3e5f5
    style AH fill:#ffecb3
    style AB fill:#ffecb3
    style GEN fill:#e8eaf6
```

## Packages

| Package | Description |
|---------|-------------|
| `@dira/core` | Framework core with decorators, routing, and middleware |
| `@dira/di` | Dependency injection container system |
| `@dira/common` | Shared utilities and error types |
| `@dira/adapter-hono` | Hono-based HTTP adapter with middleware bridge |
| `@dira/adapter-bun` | Native Bun.serve() adapter with middleware bridge |
| `@dira/codegen` | TypeScript client SDK generator |

## Request Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           HTTP Request                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Adapter (Hono / Bun)                               │
│                   Route matching & parameter extraction                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     DiraHttpRequest Created                             │
│              (extends DiContainer for DI support)                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Middleware Pipeline                                │
│  ┌─────────────┐   ┌──────────────────┐   ┌───────────────────┐        │
│  │   Global    │ → │   Controller     │ → │      Method       │        │
│  │ Middleware  │   │   Middleware     │   │    Middleware     │        │
│  └─────────────┘   └──────────────────┘   └───────────────────┘        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Route Handler                                   │
│           (with typed req.params, req.query, req.body)                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        HTTP Response                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

## Examples

### Controllers with Typed Parameters

```typescript
@DiraController('/users')
class UsersController {
  @DiraHttp('/:id', { method: 'GET' })
  getUser = handler<never, never>()('/:id', async (req) => {
    // req.params.id is typed as string
    return { id: req.params.id };
  });

  @DiraHttp('/', { method: 'POST' })
  createUser(req: DiraHttpRequest<{ name: string; email: string }>) {
    const body = await req.json();
    // body is typed as { name: string; email: string }
    return { created: true, ...body };
  }
}
```

### Middleware

```typescript
// Global middleware
dira.use(async (req, next) => {
  console.log(`${req.method} ${req.url}`);
  const response = await next();
  response.headers.set('X-Powered-By', 'Dira');
  return response;
});

// Controller/method middleware with typed context
const authMiddleware: DiraMiddleware<{}, { user: User }> = async (req, next) => {
  const token = req.headers.get('Authorization');
  if (!token) throw new HttpError(401, 'Unauthorized');
  req.ctx.user = await validateToken(token);
  return next();
};

@UseMiddleware(authMiddleware)
@DiraController('/admin')
class AdminController {
  @DiraHttp('/profile')
  profile(req: DiraHttpRequest) {
    return req.ctx.user; // Typed as User
  }
}
```

### Dependency Injection

```typescript
@Injectable({ scope: 'singleton' })
class ConfigService {
  readonly apiUrl = process.env.API_URL;
}

@Injectable()
class UserService {
  @Inject('config') config!: ConfigService;

  getApiUrl() {
    return this.config.apiUrl;
  }
}

class AppRequest extends DiraHttpRequest {
  @Cached()
  get userService() {
    return this.newInstanceOf(UserService);
  }
}

const dira = new DiraCore().setRequestClass(AppRequest);
```

### Type-Safe Client Generation

```typescript
// Generate from controllers
import { generateClient } from '@dira/codegen';

await generateClient({
  controllerGlobs: ['src/controllers/**/*.ts'],
  outFile: 'src/generated/client.ts',
});

// Use the generated client
import { createClient } from './generated/client';

const api = createClient('http://localhost:3000');
const user = await api.users.getUser.$get({ params: { id: '123' } });
// Fully typed response!
```

## Demo Applications

| Demo | Description |
|------|-------------|
| `01-minimal` | Simplest possible Dira app |
| `02-http-features` | Routes, path params, query params, request bodies |
| `03-dependency-injection` | DI system with services and custom request class |
| `04-full-app` | Production-like app with codegen, middleware, and e2e tests |
| `05-adapter-agnostic` | Same app running on both Hono and Bun adapters |
| `06-middleware` | Advanced middleware patterns with typed context |

Run any demo:

```bash
bun run --cwd demos/<demo-name> start
```

## Development

```bash
bunx nx run-many -t lint    # Lint all projects
bunx nx run-many -t test    # Run all tests
bunx nx run-many -t build   # Build all projects
```

## Dependency Management

This monorepo uses a **single version policy**:

- All dependency versions are defined in the root `package.json`
- Publishable libraries (`libs/`) must declare their runtime dependencies in their own `package.json`
- The `@nx/dependency-checks` ESLint rule enforces this automatically

```bash
# Auto-fix missing dependencies in libraries
bunx eslint libs/*/package.json --fix
```

## License

MIT
