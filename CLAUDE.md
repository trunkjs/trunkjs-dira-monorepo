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
bunx nx run hello-world:test

# Build all projects
bunx nx run-many -t build

# Start the demo server
bun run --cwd demos/hello-world start

# Generate typed client SDK from controllers
bun run --cwd demos/hello-world codegen

# Format code
bunx prettier --write .
```

## Architecture

Dira is a decorator-based HTTP framework for Bun with an adapter pattern for flexibility.

### Core Components

**libs/dira-core** - Framework core with two APIs:

- **Imperative API**: `DiraCore.registerHandler(route, handler)` for direct route registration with type-safe `DiraRequest`
- **Decorator API**: `@DiraController(prefix)` and `@DiraHttp(route)` for class-based controllers with automatic discovery via `DiraCore.discover(directory)`

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

**libs/adapter-hono** - Hono-based HTTP adapter implementing `DiraAdapter` interface. The adapter pattern allows swapping HTTP implementations without changing application code.

**libs/codegen** - Static code generation package that uses the TypeScript Compiler API to analyze Dira controllers and generate a fully-typed client SDK. Key capabilities:

- Extracts route metadata, body/query/return types from `@DiraController` and `@DiraHttp` decorators via AST analysis (no runtime reflection)
- Supports both handler patterns: method declarations with `DiraRequest<TBody, TQuery>` and the curried `handler<TBody, TQuery>()('/route', fn)` wrapper
- Generates a self-contained `.ts` file with `createClient(baseUrl)` factory producing `api.controllerName.handlerName.$method({ body?, query?, params? })` calls
- Return types are unwrapped from `Promise<T>` and `HandlerReturn<T>` unions (filtering `Response`, `void`, `null`)
- File discovery reuses `DiscoverOptions` from `@dira/core` for consistent include/exclude/recursive configuration
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
