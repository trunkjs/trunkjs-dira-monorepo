# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
bun install

# Lint all projects
bunx nx run-many -t lint

# Run all tests
bunx nx run-many -t test

# Run tests for a specific project
bunx nx run @dira/core:test
bunx nx run @dira/codegen:test
bunx nx run 04-full-app:test

# Build all projects
bunx nx run-many -t build

# Start demo servers
bun run --cwd demos/01-minimal start
bun run --cwd demos/04-full-app start

# Generate typed client SDK from controllers
bun run --cwd demos/04-full-app codegen

# Format code
bunx prettier --write .
```

## Architecture

Dira is a decorator-based HTTP framework for Bun with an adapter pattern for flexibility, built-in dependency injection, and a powerful middleware system.

### Package Structure

```
libs/
├── common/        # Shared utilities and error types
├── di/            # Dependency injection container
├── core/          # Framework core (decorators, routing, middleware)
├── adapter-hono/  # Hono-based HTTP adapter
├── adapter-bun/   # Native Bun.serve() adapter
└── codegen/       # TypeScript client SDK generator

demos/
├── 01-minimal/           # Simplest Dira app
├── 02-http-features/     # Routes, params, queries, bodies
├── 03-dependency-injection/  # DI system showcase
├── 04-full-app/          # Production-like app with codegen
├── 05-adapter-agnostic/  # Same app on different adapters
└── 06-middleware/        # Advanced middleware patterns
```

### Core Components

**@dira/common** - Shared utilities:
- `DiraError` - Base error class for framework errors
- `isStage3Decorator()` - Decorator context detection

**@dira/di** - Dependency injection system:
- `DiContainer` - Base container with `resolve<T>(token)` and `newInstanceOf<T>(cls)`
- `@Injectable({scope})` - Mark classes for DI (transient/singleton)
- `@Inject(token)` - Property decorator for dependency injection
- `@Cached()` - Getter memoization decorator

**@dira/core** - Framework core with two APIs:

- **Imperative API**: `DiraCore.registerHandler(route, handler)` for direct route registration
- **Decorator API**: `@DiraController(prefix)` and `@DiraHttp(route)` for class-based controllers with automatic discovery via `DiraCore.discover(directory)`
- **Middleware API**: `DiraCore.use(middleware)` and `@UseMiddleware(middleware)` for global/scoped middleware

**Route naming for SDK generation**: Controllers and handlers can specify explicit names used in the generated client SDK:

```typescript
@DiraController('/admin', { name: 'admin' })
export class AdminController {
  @DiraHttp('/status', { name: 'get-status' })
  status() { ... }
}
// Generated SDK: api.admin.getStatus.$get()
// Route key: 'admin.get-status'
```

Without explicit names, names are derived from the class/method names (e.g., `AdminController` → `admin`, `getStatus` → `getStatus`).

**@dira/adapter-hono** - Hono-based HTTP adapter implementing `DiraAdapter` interface. Includes `HonoMiddlewareBridge` to use Hono ecosystem middleware (cors, basicAuth, etc.) with Dira.

**@dira/adapter-bun** - Native Bun.serve() adapter without framework dependencies. Uses route-matcher for efficient pattern matching. Includes `BunMiddlewareBridge` for Bun-style middleware.

**@dira/codegen** - Static code generation package that uses the TypeScript Compiler API to analyze Dira controllers and generate a fully-typed client SDK:

- Extracts route metadata, body/query/return types from `@DiraController` and `@DiraHttp` decorators via AST analysis (no runtime reflection)
- Supports both handler patterns: method declarations with `DiraHttpRequest<TBody, TQuery>` and the curried `handler<TBody, TQuery>()('/route', fn)` wrapper
- Generates a self-contained `.ts` file with `createClient(baseUrl)` factory producing `api.controllerName.handlerName.$method({ body?, query?, params? })` calls
- Return types are unwrapped from `Promise<T>` and `HandlerReturn<T>` unions (filtering `Response`, `void`, `null`)
- **Type imports**: With `importTypes: true`, imports named exported types instead of inlining their structure, enabling IDE "go-to-definition" and reducing duplication. Falls back to inline for non-exported or anonymous types. Supports tsconfig path aliases.

### Data Flow

```
Controllers (decorated classes)
         ↓
   discover() scans .ts files, reads decorator metadata
         ↓
   registerController() extracts routes from metadata
         ↓
   DiraCore.routes[] (RouteRegistration[])
         ↓
   run(adapter) passes routes to adapter
         ↓
   Adapter starts HTTP server
```

### Middleware Flow

Middleware follows the onion model with request/response phases:

```
Global Middleware → Controller Middleware → Method Middleware → Handler
       ↓                    ↓                    ↓                ↓
    Request              Request              Request          Execute
    Phase                Phase                Phase              ↓
       ↑                    ↑                    ↑             Return
    Response             Response             Response            ↓
    Phase                Phase                Phase           Response
```

Middleware can:
- Augment request context (`req.ctx`) for downstream handlers
- Short-circuit by returning a response without calling `next()`
- Modify responses after handler execution

```typescript
// Global middleware
dira.use(async (req, next) => {
  const start = Date.now();
  const response = await next();
  response.headers.set('X-Response-Time', `${Date.now() - start}ms`);
  return response;
});

// Scoped middleware via decorator
@UseMiddleware(authMiddleware)
@DiraController('/admin')
export class AdminController {
  @UseMiddleware(requireRole('admin'))
  @DiraHttp('/settings')
  settings(req) { ... }
}
```

### Dependency Injection Flow

```
Request arrives
         ↓
   DiraHttpRequest created (extends DiContainer)
         ↓
   Custom AppRequest getters accessed on demand
         ↓
   @Cached() ensures lazy evaluation & memoization
         ↓
   newInstanceOf(Service) auto-resolves @Inject() properties
         ↓
   Request-scoped instances available to handlers
```

### Codegen Flow

```
Controller source files
         ↓
   collectTsFiles() + resolveFiles() find .ts files
         ↓
   analyzeControllers() creates ts.Program, walks AST
         ↓
   parse-decorators.ts extracts @DiraController / @DiraHttp metadata
         ↓
   analyze-types.ts extracts body, query, return types
         ↓
   generateClientCode() emits typed client .ts file
```

## Code Organization

- **One symbol per file**: Each file contains exactly one function, interface, class, or type
- **Tests as `.spec.ts` files**: Place unit tests next to source files; e2e tests go in `test/` directory

## Dependency Management

This workspace uses a **single version policy** with the `@nx/dependency-checks` ESLint rule:

- **Root `package.json`**: Defines all dependency versions (single source of truth)
- **Library `package.json`**: Must declare runtime dependencies for publishability
- **Apps (`demos/`)**: Private apps rely on workspace hoisting; no explicit deps required

The `@nx/dependency-checks` rule automatically detects missing/obsolete dependencies in publishable libraries during linting. Run `bunx nx run-many -t lint --fix` to auto-fix dependency issues.

```bash
# Check dependencies
bunx nx run-many -t lint

# Auto-fix missing dependencies
bunx eslint libs/*/package.json --fix
```

## Nx Integration

Always use Nx to run tasks:

```bash
bunx nx run-many -t <target>      # Run target for all projects
bunx nx run <project>:<target>    # Run target for specific project
```

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable. For questions around nx configuration, use the `nx_docs` tool for up-to-date documentation.

<!-- nx configuration end-->
