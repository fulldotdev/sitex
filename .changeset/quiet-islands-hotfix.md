---
"@fulldotdev/sitex": patch
---

Fix dev server and island bundling issues:

- Only the ssr environment writes the generated `.sitex` type files, so the client and ssr environments no longer race each other on `.sitex/typecheck`.
- Adding a `client:*` directive while the dev server runs now refreshes the island registry instead of requiring a restart.
- An island component that contains its own `client:*` directive no longer pulls `react-dom/static` into the browser bundle.
- Island components are registered as dependency optimization entries, so a cold dev server no longer re-optimizes and reloads during the first page load (which briefly ran two React copies and logged "Invalid hook call").
- The package README matches the shipped API again: the main entry exports types only, and layout components come from the Sitex shadcn registry.
