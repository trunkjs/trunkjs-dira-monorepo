# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
bun install

# Run all tests
bunx nx run-many -t test

# Run tests for a specific project
bunx nx run @dira/dira-core:test
bunx nx run hello-world:test

# Build all projects
bunx nx run-many -t build

# Start the demo server
bun run --cwd demos/hello-world start

# Format code
bunx prettier --write .
```

## Architecture

Dira is a decorator-based HTTP framework for Bun with an adapter pattern for flexibility.

### Core Components

**libs/dira-core** - Framework core with two APIs:
- **Imperative API**: `DiraCore.registerHttpHandler(route, handler)` for direct route registration
- **Decorator API**: `@DiraController(prefix)` and `@DiraHttp(route)` for class-based controllers with automatic discovery via `DiraCore.discover(directory)`

**libs/adapter-hono** - Hono-based HTTP adapter implementing `DiraAdapter` interface. The adapter pattern allows swapping HTTP implementations without changing application code.

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

## Code Organization

- **One symbol per file**: Each file contains exactly one function, interface, class, or type
- **Dependencies in root package.json only**: Sub-packages must not define their own dependencies
- **Tests as `.spec.ts` files**: Place unit tests next to source files; e2e tests go in `test/` directory

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
