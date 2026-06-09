# @fulldotdev/sitex

## 0.3.0

### Minor Changes

- Add MDX pages with layout-based rendering, page data from MDX frontmatter, and configurable MDX components.

  Add server-rendered TSX pages through `export const render = "server"`, while keeping static routes as the default build output.

  Improve island rendering with `client:load`, `client:only`, `client:visible`, `client:idle`, and `client:media`.

  Refresh the documentation for the 0.3 page model, deployment behavior, component rendering, and project structure.

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
