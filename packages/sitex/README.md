# Sitex

An opinionated, Vite-based React framework for building fast content sites.

Pages are MDX documents with typed frontmatter, rendered through your TSX layouts into static HTML. Sitex owns routing, static output, head defaults, sitemap, robots.txt, and island scripts. Layouts render the full document with normal TSX. When a component needs browser interactivity, it opts into island rendering with `client:load`, `client:only`, `client:visible`, `client:idle`, or `client:media`.

## Install

```bash
pnpm add @fulldotdev/sitex react react-dom vite vite-plus @vitejs/plugin-react
pnpm add -D typescript @types/react @types/react-dom
```

If pnpm asks about dependency build scripts, approve the packages your project trusts in your workspace configuration.

```ts
// vite.config.ts
import { defineConfig } from "vite-plus"
import { sitex } from "@fulldotdev/sitex/plugin"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react(), sitex()],
})
```

```json
// tsconfig.json
{
  "extends": "@fulldotdev/sitex/tsconfig"
}
```

The shared tsconfig brings the includes, the generated `.sitex` types, and the `@/*` alias for `src/`. Add `.sitex` to `.gitignore`.

Builds need an absolute site URL for canonical, sitemap, and robots output. Deploy platforms provide one automatically (`SITE_URL`, `PUBLIC_SITE_URL`, Netlify, Vercel, Cloudflare Pages, Render, Railway, or Koyeb URL/domain vars); otherwise pass `sitex({ site: { url: "https://example.com" } })`.

## First Page

Create these four files and the site runs.

```css
/* src/index.css */
body {
  font-family: system-ui, sans-serif;
}
```

```yaml
# src/globals/index.yaml
name: My Site
```

```tsx
// src/layouts/default.tsx
import type { LayoutProps } from "@fulldotdev/sitex"
import globals from "sitex:globals"

import "@/index.css"

export default function DefaultLayout({ title, children }: LayoutProps) {
  return (
    <html>
      <head>
        <title>{title}</title>
      </head>
      <body>
        <header>{globals.name}</header>
        <main>
          <h1>{title}</h1>
          {children}
        </main>
      </body>
    </html>
  )
}
```

```mdx
---
layout: "default"
title: "My Site"
description: "My first Sitex page."
---

Hello from Sitex.
```

Sitex adds the missing head defaults (charset, viewport, canonical, `og:url`, favicon) and hoists JSON-LD into the head. `@fulldotdev/sitex` itself exports types only; ready-made layout and content components install from the Sitex shadcn registry at https://sitex.full.dev/docs/components.

## Globals

`src/globals/index.yaml` holds visible site chrome content that layouts share, like the site name, logo, and navigation. Import it with `sitex:globals`; the types are generated from the file. Extra files like `src/globals/nl.yaml` define locale variants served under `/nl` routes and are available through the `locales` export.

## Commands

```bash
vp dev      # dev server with the same rendering pipeline as the build
vp build    # static build to dist/
vp preview  # serve the built output
```

## Documentation

See https://sitex.full.dev/docs or the local docs app in `apps/docs/src/pages/docs`.

## License

MIT.
