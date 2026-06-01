# SiteX

A simpler, Vite-based React framework for building fast websites with local content.

SiteX renders React routes to static HTML by default. When a page needs browser interactivity, imported React components can opt into island rendering with `client:load` or `client:only`.

## Install

```bash
pnpm add @fulldotdev/sitex react react-dom vite @vitejs/plugin-react
pnpm add -D typescript @types/react @types/react-dom
```

If pnpm asks about dependency build scripts, approve the packages your project
trusts in your workspace configuration.

## Vite

```ts
import { defineConfig } from "vite"
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
pnpm dev
pnpm build
pnpm preview
```

## Documentation

See the local docs app in `src/pages/docs`.

## License

MIT.
