# @fulldotdev/sitex

## 0.4.1

### Patch Changes

- [#9](https://github.com/fulldotdev/sitex/pull/9) [`77fe7ea`](https://github.com/fulldotdev/sitex/commit/77fe7eac8d79ec99ca7bbccf8442793f99acce85) Thanks [@silveltman](https://github.com/silveltman)! - Fix dev server and island bundling issues:

  - Only the ssr environment writes the generated `.sitex` type files, so the client and ssr environments no longer race each other on `.sitex/typecheck`.
  - Adding a `client:*` directive while the dev server runs now refreshes the island registry instead of requiring a restart.
  - An island component that contains its own `client:*` directive no longer pulls `react-dom/static` into the browser bundle.
  - Island components are registered as dependency optimization entries, so a cold dev server no longer re-optimizes and reloads during the first page load (which briefly ran two React copies and logged "Invalid hook call").
  - The package README matches the shipped API again: the main entry exports types only, and layout components come from the Sitex shadcn registry.

## 0.4.0

### Minor Changes

- [#7](https://github.com/fulldotdev/sitex/pull/7) [`ecb3779`](https://github.com/fulldotdev/sitex/commit/ecb3779c3a9c89803ddf86def07de2a684a6c223) Thanks [@silveltman](https://github.com/silveltman)! - Rebuild Sitex around MDX-only pages and a framework-owned document head.

  Breaking changes:

  - Pages are MDX files only. TSX files in `src/pages` fail the build with a migration error; move page markup into layouts and blocks. Dynamic `[param]` routes and the `paths` export are removed.
  - Builds require a site URL: `sitex({ site: { url } })` or a deploy platform URL variable. `site.locale` names the root locale.
  - Frontmatter follows a validated schema: `layout`, `title`, and `description` are required. `type` (`webpage` | `article` | `faq`) drives JSON-LD structured data; `image`, `canonical`, and `noindex` are optional overrides. Articles require `publishedAt`; FAQ pages require `questions`.
  - Apps do not provide `index.html`. Layouts render the full document (`<html>`/`<head>`/`<body>`) and Sitex parses the rendered page to add missing head defaults (charset, viewport, canonical, og:url, robots, favicon, generator) and hoist JSON-LD into the head.
  - Layouts import their stylesheet (for example `src/index.css`); every CSS file under `src` becomes a build entry. Tailwind is not bundled by Sitex; apps that use Tailwind install `tailwindcss` and `@tailwindcss/vite` themselves.
  - `MarkdownLayoutProps` is renamed to `LayoutProps` and now includes the page schema fields. `PageContext`, `StaticPath`, and `StaticPaths` are removed.
  - `sitex:pages` has a stable, statically declared `Page` type; generated `.sitex/pages.d.ts` files are no longer written (legacy ones are cleaned up automatically).
  - The `src/pages/examples/**` exemption is removed; everything under `src/pages` is a page.
  - The main entry no longer exports UI components (`Layout`, `Section`, `Typography`, `Price`, and friends). They moved to the Sitex shadcn registry; install them with `shadcn add` from `https://sitex.full.dev/r/{name}.json`. `@fulldotdev/sitex` now exports types only, plus the `/plugin` and `/island` entries.
  - Globals moved to `src/globals/index.yaml` as the root locale file. The root locale name comes from the new `site.locale` option (default `"en"`); additional files like `nl.yaml` define locale variants served under `/nl` route prefixes and are exposed through the `locales` export of `sitex:globals`. A single named file like `en.yaml` still works as the root locale.
  - Static HTML is rendered in-process during `vp build` through a dedicated SSR build environment; Sitex no longer boots a second Vite server after the client build.

  New:

  - Link prefetching is on by default: speculation rules let supporting browsers prerender on hover, with a small hover-prefetch fallback module for others. Opt out with `prefetch: false` or `data-no-prefetch`.
  - `vp build` writes `sitemap.xml` (respects `noindex` and `canonical` overrides, `lastmod` from `updatedAt`/`publishedAt`) and a default `robots.txt` when the app ships none.
  - Path-alias imports (like `@/components/alert`) now resolve inside MDX pages on newer Vite resolvers.
  - Frontmatter validation errors are targeted per field, and MDX pages are typechecked against their layout props via `.sitex/typecheck`.

## 0.3.0

### Minor Changes

- Add MDX pages with layout-based rendering, page data from MDX frontmatter, and configurable MDX components.

  Keep pages static and MDX-only, with TSX layouts and components for structure.

  Improve island rendering with `client:load`, `client:only`, `client:visible`, `client:idle`, and `client:media`.

  Refresh the documentation for the 0.3 page model, component rendering, and project structure.

## 0.2.1

### Patch Changes

- [`8a6ef88`](https://github.com/fulldotdev/sitex/commit/8a6ef88b4148ab99f5fdad0217ddbbbc33476055) Thanks [@silveltman](https://github.com/silveltman)! - Add fallback `sitex:pages` types so projects can typecheck before generated page data types exist.

## 0.2.0

### Minor Changes

- [`00eab4d`](https://github.com/fulldotdev/sitex/commit/00eab4d753c28b307e0dd60ea7814c8d9e4aca56) Thanks [@silveltman](https://github.com/silveltman)! - Add a typed route page data API through `sitex:pages`, including generated page data types, `getPages`, and `getPage`.

  Update SiteX for Vite 8, switch package bundling to Rolldown, externalize peer dependency subpaths correctly, and build CSS entry points through Vite's Rolldown input configuration.

  Refresh the documentation site with a Pages API page, page-data-driven docs navigation, hydrated code-block copy buttons, and updated installation guidance.

## 0.1.3

### Patch Changes

- Discover route CSS through Vite's module graph instead of scanning source files with a regex, and inject the discovered production CSS into generated static HTML.

- Simplify the docs layout shell and theme handling.

## 0.1.2

### Patch Changes

- [#4](https://github.com/fulldotdev/sitex/pull/4) [`a243305`](https://github.com/fulldotdev/sitex/commit/a243305c88d7cdcab1e394f7054dcdb791991c09) Thanks [@silveltman](https://github.com/silveltman)! - Remove pnpm build-script approval flags from the primary install command and document that build-script approvals belong in project package manager configuration.

## 0.1.1

### Patch Changes

- [#1](https://github.com/fulldotdev/sitex/pull/1) [`729204e`](https://github.com/fulldotdev/sitex/commit/729204e6177935ab87ae9bd51decef8c42e9fab8) Thanks [@silveltman](https://github.com/silveltman)! - Publish compiled package entrypoints for the Vite plugin and island runtime so consumers no longer load TypeScript files from node_modules.
