# SiteX

A simpler, Vite-based React framework for building fast websites with local content.

SiteX renders React routes to static HTML by default. When a page needs browser interactivity, imported React components can opt into island rendering with `client:load` or `client:only`.

## Install

```bash
pnpm add @fulldotdev/sitex react react-dom vite vite-plus @vitejs/plugin-react
pnpm add -D typescript @types/react @types/react-dom
```

If pnpm asks about dependency build scripts, approve the packages your project
trusts in your workspace configuration.

## Vite+

SiteX requires Vite+ with Vite 8 or newer.

```ts
import { defineConfig } from "vite-plus"
import { sitex } from "@fulldotdev/sitex/plugin"
import react from "@vitejs/plugin-react"

export default defineConfig({
  appType: "custom",
  plugins: [react(), sitex()],
})
```

## TypeScript

```json
{
  "extends": "@fulldotdev/sitex/tsconfig",
  "include": ["src/**/*", "vite.config.ts"]
}
```

## Scripts

```bash
pnpm dev    # watch-build the package
pnpm build  # pack the publishable package output
pnpm check  # run Vite+ checks
```

## Documentation

See the local docs app in `apps/docs/src/pages/docs`.

## License

MIT.
