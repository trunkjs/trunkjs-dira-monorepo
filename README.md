# Dira

A decorator-based HTTP framework for Bun with an adapter pattern for flexibility.

## Quick Start

```bash
bun install
bun run --cwd demos/hello-world start
```

## Packages

| Package              | Description                                       |
| -------------------- | ------------------------------------------------- |
| `@dira/core`         | Framework core with decorator and imperative APIs |
| `@dira/adapter-hono` | Hono-based HTTP adapter                           |
| `@dira/codegen`      | TypeScript client SDK generator                   |

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
