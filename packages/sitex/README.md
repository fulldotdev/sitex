# Sitex

An opinionated, Vite-based React framework for building fast content sites.

Pages are MDX documents with typed frontmatter, rendered through your TSX layouts into a Vite HTML pipeline. Sitex owns routing, static output, sitemap, robots.txt, and island scripts. Your layouts import CSS and render native document tags with normal TSX. When a page needs browser interactivity, imported React components opt into island rendering with `client:load`, `client:only`, `client:visible`, `client:idle`, or `client:media`.

## Install

```bash
pnpm add @fulldotdev/sitex react react-dom vite vite-plus @vitejs/plugin-react
pnpm add -D typescript @types/react @types/react-dom
```

If pnpm asks about dependency build scripts, approve the packages your project
trusts in your workspace configuration.

## Vite+

Sitex requires Vite+ with Vite 8 or newer.

```ts
import { defineConfig } from "vite-plus"
import { sitex } from "@fulldotdev/sitex/plugin"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react(), sitex()],
})
```

Builds need an absolute site URL for canonical, sitemap, and robots output. Deploy platforms provide one automatically (`SITE_URL`, `PUBLIC_SITE_URL`, Netlify, Vercel, Cloudflare Pages, Render, Railway, or Koyeb URL/domain vars); otherwise pass `sitex({ site: { url: "https://example.com" } })`.

Create `src/index.css` and import it from your app's base layout. Add Tailwind or any other CSS tooling in your app when you want it.

Sitex generates `/favicon.svg` unless the app provides `public/favicon.svg`. Pass `favicon: false` to disable this.

Create `src/globals/index.yaml` for visible site chrome content that layouts reuse. The root locale name comes from `site.locale` (default `"en"`). Additional files like `src/globals/nl.yaml` define locale variants served under `/nl` routes; layouts read them from the `locales` export of `sitex:globals`.

```yaml
name: My Site
logo:
  label: My Site
  href: /
header:
  navigation:
    - label: Docs
      href: /docs
```

Import it from layouts with `sitex:globals`. Keep Vite `site` config for stable site facts. Keep navigation, logo labels, footer links, and other visible chrome content in `src/globals/index.yaml`.

## TypeScript

```json
{
  "extends": "@fulldotdev/sitex/tsconfig"
}
```

The shared config brings the includes, the generated `.sitex` types, and the `@/*` alias.

## First Page

```tsx
import {
  Layout,
  LayoutBody,
  LayoutHead,
  type LayoutProps,
} from "@fulldotdev/sitex"

export default function DefaultLayout({
  title,
  description,
  locale,
  url,
  children,
}: LayoutProps) {
  return (
    <Layout lang={locale}>
      <LayoutHead title={title} description={description} url={url} />
      <LayoutBody>
        <main>{children}</main>
      </LayoutBody>
    </Layout>
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

## Scripts

```bash
pnpm dev    # watch-build the package
pnpm build  # pack the publishable package output
pnpm check  # run Vite+ checks
```

## Documentation

See https://sitex.full.dev/docs or the local docs app in `apps/docs/src/pages/docs`.

## License

MIT.
