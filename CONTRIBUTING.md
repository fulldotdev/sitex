# Contributing

SiteX is experimental. Keep changes small, explicit, and aligned with the current scope.

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

- Keep the public API small: the Vite plugin, TypeScript config, and client directives.
- Prefer static routes and explicit TSX files.
- Document the decision before adding generated routes, content collections, rendering modes, or new client directives.
- Preserve the reference app as a simple content-site example.
