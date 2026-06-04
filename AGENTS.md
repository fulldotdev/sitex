# AGENTS.md

- SiteX is a Vite-based React framework for static content sites.
- The repo follows the Vite+ monorepo shape: docs app in `apps/docs`, package in `packages/sitex`.
- Docs routes live in `apps/docs/src/pages` and render to static HTML by default.
- Client interactivity uses imported islands with `client:load` or `client:only`.
- Keep routes thin: routes choose layouts, layouts compose blocks, blocks use UI.
- Do not add SSR, generated routes, content collections, or new directives casually.
