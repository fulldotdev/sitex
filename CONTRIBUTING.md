# Contributing

Sitex is experimental. Keep changes small, explicit, and aligned with the current scope.

## Local setup

```bash
pnpm install
pnpm dev
```

## Checks

Run these before opening a pull request:

```bash
pnpm check
pnpm ready
```

## Scope

- Keep the public API small: the Vite plugin, the type exports, the TypeScript config, and the `client:*` directives.
- Pages are static MDX files rendered through app layouts. Document the decision before adding rendering modes, generated routes, or content collections.
- UI components live in `packages/ui` and ship through the shadcn registry, not npm.
- The docs app in `apps/docs` is the reference app; keep it a simple content site.
