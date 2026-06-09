# Sitex

Sitex is an experimental framework for building static sites from React route modules with narrowly scoped client interactivity.

## Language

**Static route**:
A URL that Sitex can render to static HTML ahead of serving a request. A static route may be authored directly as a local route file today, and may later be generated from data without becoming an SSR route.
_Avoid_: SSR route, request route

**Local route**:
A static route represented by one concrete route file in the app. This is the current v0 routing target because it keeps routing explicit and simple.
_Avoid_: dynamic route

**Route module**:
A file discovered by Sitex routing. A local route module default-exports a page component; a future generated static route module may default-export `definePages(...)`.
_Avoid_: page

**Page component**:
The React component exported by a local route module to render one static route.
_Avoid_: route, entry

**Generated static route**:
A static route produced from one route module plus one or more data entries. This is a possible future routing shape for external or local data sources, but not the current v0 default.
_Avoid_: dynamic route, SSR route

**Generated static route module**:
A future route module that explicitly exports `definePages(...)` to produce multiple static routes. Generated static route modules should be signaled by their API shape, not by catch-all filename syntax.
_Avoid_: catch-all route, `[...page]`

**Route entry**:
One data item used by a future generated static route module to produce one static route.
_Avoid_: page, route

**App-provided data**:
Data loaded or declared by the app and passed into Sitex route APIs. Sitex core should not require a built-in content collection model.
_Avoid_: Sitex content collection

**Recommended app structure**:
An app-owned organization where route modules stay thin, layouts compose page chrome, blocks define reusable page sections, and UI primitives hold low-level design-system components. Sitex recommends this structure but does not require or interpret it.
_Avoid_: framework layout system

**Reference app**:
An app that both documents Sitex and proves the recommended app structure against real static routes and islands. The docs app is the current reference app.
_Avoid_: component showcase

**Repository shape**:
The repo follows Vite+'s monorepo shape: `packages/sitex` contains the framework package and `apps/docs` contains the docs/reference app.
_Avoid_: mixing package and app concerns in the repository root

**Framework import**:
Published apps should import Sitex through package-style public imports such as `@fulldotdev/sitex/plugin`. The in-repo docs app may import package source directly when dogfooding unpublished changes.
_Avoid_: exposing framework internals as app-facing public APIs

**Hidden island runtime**:
The React runtime code Sitex uses under the hood to mark, load, hydrate, and client-render islands. App authors should not need to import this directly.
_Avoid_: React helpers

**Public surface**:
The current public surface should be the Sitex Vite plugin and JSX client directives. Other runtime pieces should stay hidden behind compiler/plugin behavior.
_Avoid_: direct island imports, document helper imports

**Router export**:
Route rendering internals are framework-owned virtual module code. Apps should not import route rendering helpers directly.
_Avoid_: public router helpers

**TypeScript config export**:
`@fulldotdev/sitex/tsconfig` may remain as a convenience for framework-required compiler settings and JSX directive types. It should not become a broad app preference bundle.
_Avoid_: app style config

**Directive validation**:
TypeScript may broadly allow `client:*` attributes, but the compiler is responsible for rejecting invalid directive placement such as HTML elements or local components.
_Avoid_: type-only enforcement

**Package build**:
Sitex is published as `@fulldotdev/sitex` from `packages/sitex`. Public app-facing imports should use exported package entrypoints, while the in-repo docs app may import package source directly when dogfooding unpublished changes.
_Avoid_: app imports from unexported internals

**Production build**:
The public production build command should be `vp build`. Any custom Sitex build script is experiment scaffolding; cleanup should keep static route rendering and asset emission inside the Sitex Vite plugin.
_Avoid_: separate Sitex build command

**Development server**:
The public development command should be `vp dev`. Sitex development behavior should come from the Vite plugin rather than a custom dev server command.
_Avoid_: separate Sitex dev command

**Document shell**:
The app-owned HTML structure for a page, including `<html>`, `<head>`, and `<body>`. Sitex supplies small document primitives, but the app decides the shell through its own layouts.
_Avoid_: framework document, global app root

**Root document shell**:
The ordinary TSX document markup returned by each route render through the app's root layout. Sitex should not require Sitex-specific document components or validate more than asset injection needs.
_Avoid_: page fragment

**Document metadata**:
Plain TSX rendered inside the app-owned document shell, such as `<title>` and `<meta>` tags. Sitex should not require helper components for ordinary metadata.
_Avoid_: metadata API

**Build asset injection**:
Framework-owned insertion of production asset tags such as stylesheet and island client scripts. Sitex should not require app-placed `HeadContent` or `Scripts` helper components for this.
_Avoid_: document helper components

**Style entry**:
An app-owned CSS import that Vite includes in the module graph. Sitex should support normal Vite CSS imports wherever the app chooses to place them.
_Avoid_: required global stylesheet component

**CSS API**:
Sitex should not expose a CSS-specific API. Styling should flow through normal Vite CSS imports and Sitex should ensure those assets appear in static output.
_Avoid_: stylesheet helper, styles config

**Island**:
An imported React component that opts into browser interactivity inside otherwise static HTML.
_Avoid_: app root, hydrated page

**Island root**:
The imported React component that carries a `client:*` directive. An island root cannot be an HTML element or a component declared locally inside the same route module.
_Avoid_: intrinsic island, inline island

**Rendering mode**:
The way Sitex decides where a page or component is rendered. Current page modes are static by default and explicit request-time rendering with `export const render = "server"`. Current island modes are static plus client rendering with `client:load`, `client:visible`, `client:idle`, or `client:media`, and browser-only rendering with `client:only`.
_Avoid_: hydration mode

**Static rendering**:
The default rendering mode. Static rendering produces HTML ahead of serving requests and does not attach browser interactivity.
_Avoid_: server rendering

**Client rendering**:
Browser rendering used for interactivity. `client:load`, `client:visible`, `client:idle`, and `client:media` combine static rendering with client rendering, while `client:only` uses client rendering only.
_Avoid_: hydration

**Server rendering**:
Request-time page rendering on a server. Sitex supports this only through explicit route opt-in with `export const render = "server"`.
_Avoid_: static rendering

**Server directive**:
A possible future directive for request-time server rendering behavior. Server directives are reserved conceptually but are not part of the current Sitex API.
_Avoid_: current API

**Client-loaded island**:
An island marked with `client:load`. A client-loaded island is statically rendered first and then client-rendered for interactivity.
_Avoid_: browser-only island

**Lazy island**:
An island marked with `client:visible`, `client:idle`, or `client:media`. A lazy island is statically rendered first and then client-rendered after the chosen browser condition is met.
_Avoid_: separate route, server island

**Static children**:
Children passed through an island boundary as static slot HTML. Static children stay visible but do not become live React children in the parent island's client tree.
_Avoid_: included children, live React children

**Static slot model**:
The Astro-like model for island children. Children are rendered as static slot HTML, and any nested `client:*` components inside them are independent islands rather than part of the parent island's live React tree.
_Avoid_: live subtree hydration

**Independent island**:
An island that client-renders separately from any surrounding island. Static children may contain independent islands, but those islands do not share a React tree, context, or state with the surrounding island.
_Avoid_: included island, subtree island

**Island props**:
Data passed from static rendering into an island root. Island props must be JSON-serializable data; behavior should live inside the island root component.
_Avoid_: function props, React element props

**Prop serialization**:
Sitex v0 should use a simple JSON-only serialization boundary for island props. Astro-like support for `Date`, `Map`, `Set`, `BigInt`, and similar values is a possible later enhancement, not cleanup scope.
_Avoid_: rich serializer

**Invalid island prop**:
A value that cannot safely cross the static-to-client boundary, such as a function, symbol, React element, cyclic object, or ambiguous dropped value. Invalid island props should cause a hard framework error.
_Avoid_: stringified function, silently dropped prop

**Prop serialization error**:
A targeted Sitex error raised when an island prop cannot be represented by the v0 JSON-only serializer.
_Avoid_: raw `JSON.stringify` failure

**Browser-only island**:
An island marked with `client:only`. A browser-only island has no initial static render; it is invisible until the browser renders it.
_Avoid_: hydrated island, fallback island

**Simplicity principle**:
Sitex should keep the current experiment extremely small and explicit, even when that postpones useful framework conveniences.
_Avoid_: complete framework

## Flagged Ambiguities

**Hydration naming**:
The code currently uses `hydration` names for the island runtime, but the preferred product language is rendering modes: static rendering, client rendering, and future server rendering. Do not change the code during the grilling session; revisit this in the later cleanup/refactor.

**Document helpers**:
The current `HeadContent` and `Scripts` helpers leak build asset concerns into the app-owned document shell. Cleanup should remove them and replace them with framework-owned build asset injection.

**Document validation**:
Sitex should not validate document structure beyond what it needs for asset injection. Missing insertion points should produce targeted errors only when injection cannot proceed.

**Nested island transform**:
Static children should be allowed to contain independent islands. The current compiler may miss literal nested `client:*` directives inside the same transformed JSX subtree; revisit this in the later cleanup/refactor.

**Subtree island API**:
The earlier `children:include` experiment made a parent island and its children one React tree. It may never be needed because shared client state can be modeled by creating a larger island root component.

**Shared client tree**:
A set of interactive components that need shared React state or context. A shared client tree should be composed inside one island root component rather than through a subtree hydration directive.
_Avoid_: `children:include`

## Example Dialogue

Developer: "Should this service page be a server route?"

Domain expert: "No. It should be a static route unless it actually needs request-time data."

Developer: "Where do page metadata and scripts belong?"

Domain expert: "In the app-owned document shell. Sitex can provide primitives, but the app's layouts own the actual document structure."

Developer: "This sidebar needs search and theme toggling. Is the whole page an island?"

Domain expert: "No. The sidebar can be an island, while the page body remains static children."

Developer: "Should `client:only` include fallback children?"

Domain expert: "No. A browser-only island has no initial static render; it appears when the browser renders it."

Developer: "Filters and results need shared React state. Should I use `children:include`?"

Domain expert: "No. Make a `Dashboard` island root that renders the provider, filters, and results internally."
