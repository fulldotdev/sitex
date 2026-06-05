import Doc from "@/components/layouts/doc"
import { CodeBlock } from "@/components/ui/code-block"

export const data = {
  title: "Island rendering",
  description: "Client rendering with explicit island boundaries.",
  order: 6,
  tocItems: [
    { href: "#overview", label: "Overview" },
    { href: "#choosing-directives", label: "Choosing directives" },
    { href: "#client-load", label: "client:load" },
    { href: "#client-only", label: "client:only" },
    { href: "#client-visible", label: "client:visible" },
    { href: "#client-idle", label: "client:idle" },
    { href: "#client-media", label: "client:media" },
    { href: "#boundaries", label: "Boundaries" },
  ],
}

export default function IslandRenderingPage() {
  return (
    <Doc
      title={data.title}
      description={data.description}
      path="/docs/island-rendering"
      doc={data}
    >
      <h2 id="overview">Overview</h2>
      <p>
        Sitex renders everything statically unless an imported component uses a
        client directive. That directive creates an island: a small
        client-rendered boundary inside the static page.
      </p>
      <p>
        The island client script is only added to pages that actually contain an
        island. Pages without client directives stay static HTML.
      </p>

      <h2 id="choosing-directives">Choosing directives</h2>
      <p>
        Use the least eager directive that still matches the interaction. This
        keeps the page responsive without loading every island at the same time.
      </p>
      <ol>
        <li>
          Use <code>client:load</code> for controls that must be interactive as
          soon as possible.
        </li>
        <li>
          Use <code>client:idle</code> for page chrome that is already useful as
          static HTML, such as a sidebar or theme-aware shell.
        </li>
        <li>
          Use <code>client:visible</code> for below-the-fold widgets and
          repeated controls, such as copy buttons in long documentation pages.
        </li>
        <li>
          Use <code>client:media</code> for viewport-specific UI that should
          hydrate only when a media query matches.
        </li>
      </ol>

      <h2 id="client-load">
        <code>client:load</code>
      </h2>
      <p>
        Add <code>client:load</code> to an imported React component when it
        should render as static HTML first and hydrate immediately in the
        browser. Reach for this when delayed interactivity would be noticeable.
      </p>
      <CodeBlock
        lang="tsx"
        code={`import Search from "@/components/search"

export default function Page() {
  return <Search client:load />
}`}
      />

      <h2 id="client-only">
        <code>client:only</code>
      </h2>
      <p>
        Add <code>client:only</code> when a component should be invisible in the
        static HTML and render only in the browser.
      </p>
      <CodeBlock
        lang="tsx"
        code={`import Search from "@/components/search"

export default function Page() {
  return <Search client:only />
}`}
      />

      <h2 id="client-visible">
        <code>client:visible</code>
      </h2>
      <p>
        Add <code>client:visible</code> when a component should render as static
        HTML first and hydrate when it enters the viewport. This works well for
        repeated widgets on long pages.
      </p>
      <CodeBlock
        lang="tsx"
        code={`import CopyButton from "@/components/copy-button"

export default function Page() {
  return <CopyButton client:visible value="pnpm build" />
}`}
      />

      <h2 id="client-idle">
        <code>client:idle</code>
      </h2>
      <p>
        Add <code>client:idle</code> when a component should render as static
        HTML first and hydrate after the browser has idle time. This is a good
        fit for UI that enhances already-rendered markup.
      </p>
      <CodeBlock
        lang="tsx"
        code={`import Sidebar from "@/components/sidebar"

export default function Page() {
  return <Sidebar client:idle />
}`}
      />

      <h2 id="client-media">
        <code>client:media</code>
      </h2>
      <p>
        Add <code>client:media</code> with a media query when a component should
        hydrate only after that query matches.
      </p>
      <CodeBlock
        lang="tsx"
        code={`import DesktopNav from "@/components/desktop-nav"

export default function Page() {
  return <DesktopNav client:media="(min-width: 64rem)" />
}`}
      />

      <h2 id="boundaries">Boundaries</h2>
      <p>
        Island roots must be imported React components. A directive on an HTML
        element or a locally declared component is rejected.
      </p>
      <p>
        Props must be JSON-serializable data. Functions, symbols, cyclic values,
        and React elements cannot cross the static-to-client boundary as props.
      </p>
      <p>
        Children are rendered as static slot HTML. If those children contain
        another island, it renders independently with its own client boundary.
      </p>
      <p>
        Sitex reads the static children marker from the direct children of the
        island root. Nested islands therefore cannot accidentally steal their
        parent island&apos;s static children.
      </p>
    </Doc>
  )
}
