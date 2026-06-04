# SiteX Workspace

SiteX is a Vite+ monorepo with one docs app and one publishable framework
package.

## Structure

```txt
apps/docs/        # SiteX docs and reference app
packages/sitex/   # @fulldotdev/sitex package source
```

## Scripts

```bash
pnpm dev      # run the docs app
pnpm build    # build all workspace packages/apps
pnpm check    # format, lint, and typecheck
pnpm ready    # check and build everything
```

## Package

The framework package lives in `packages/sitex` and is published as
`@fulldotdev/sitex`.
