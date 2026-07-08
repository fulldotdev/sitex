---
"@fulldotdev/sitex": minor
---

Rebuild Sitex around MDX-only pages and a framework-owned document head.

Breaking changes:

- Pages are MDX files only. TSX files in `src/pages` fail the build with a migration error; move page markup into layouts and blocks. Dynamic `[param]` routes and the `paths` export are removed.
- The `site` config is required: `sitex({ site: { name, url } })`. Optional fields: `description`, `titleTemplate`, `locale`, `image`, `favicon`, `twitter`, `organization`.
- Frontmatter follows a validated schema: `layout`, `title`, and `description` are required. `type` (`webpage` | `article` | `faq`) drives JSON-LD structured data; `image`, `canonical`, and `index` are optional overrides. Articles require `publishedAt`; FAQ pages require `questions`.
- Apps do not provide `index.html`. Layouts render the full document (`<html>`/`<head>`/`<body>`) and Sitex parses the rendered page to add missing head defaults (charset, viewport, canonical, og:url, robots, favicon, generator) and hoist JSON-LD into the head.
- `src/styles/global.css` is required and automatically imported as the global stylesheet entry. Tailwind is not bundled by Sitex; apps that use Tailwind install `tailwindcss` and `@tailwindcss/vite` themselves.
- `MarkdownLayoutProps` is renamed to `LayoutProps` and now includes the page schema fields. `PageContext`, `StaticPath`, and `StaticPaths` are removed.
- `sitex:pages` has a stable, statically declared `Page` type; generated `.sitex/pages.d.ts` files are no longer written (legacy ones are cleaned up automatically).
- The `src/pages/examples/**` exemption is removed; everything under `src/pages` is a page.
- The main entry no longer exports UI components (`Layout`, `Section`, `Typography`, `Price`, and friends). They moved to the Sitex shadcn registry; install them with `shadcn add` from `https://sitex.full.dev/r/{name}.json`. `@fulldotdev/sitex` now exports types only, plus the `/plugin` and `/island` entries.
- Globals moved to `src/globals/index.yaml` as the root locale file. The root locale name comes from the new `site.locale` option (default `"en"`); additional files like `nl.yaml` define locale variants served under `/nl` route prefixes and are exposed through the `locales` export of `sitex:globals`. A single named file like `en.yaml` still works as the root locale.
- Static HTML is rendered in-process during `vp build` through a dedicated SSR build environment; Sitex no longer boots a second Vite server after the client build.

New:

- Link prefetching is on by default: speculation rules let supporting browsers prerender on hover, with a small hover-prefetch fallback module for others. Opt out with `prefetch: false` or `data-no-prefetch`.
- `vp build` writes `sitemap.xml` (respects `index: false` and `canonical` overrides, `lastmod` from `updatedAt`/`publishedAt`) and a default `robots.txt` when the app ships none.
- Path-alias imports (like `@/components/alert`) now resolve inside MDX pages on newer Vite resolvers.
- Frontmatter validation errors are targeted per field, and MDX pages are typechecked against their layout props via `.sitex/typecheck`.
