import Doc from "@/components/layouts/doc"
import { CodeBlock } from "@/components/ui/code-block"

export const content = {
  title: "Island rendering",
  description: "Client rendering with explicit island boundaries.",
  order: 5,
  tocItems: [
    { href: "#overview", label: "Overview" },
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
      title={content.title}
      description={content.description}
      path="/docs/island-rendering"
      doc={content}
    >
      <h2 id="overview">Overview</h2>
      <p>
        Sitex renders everything statically unless an imported component uses a
        client directive. That directive creates an island: a small
        client-rendered boundary inside the static page.
      </p>

      <h2 id="client-load">
        <code>client:load</code>
      </h2>
      <p>
        Add <code>client:load</code> to an imported React component when it
        should render as static HTML first and then become interactive in the
        browser.
      </p>
      <CodeBlock
        lang="tsx"
        code={`import Sidebar from "@/components/sidebar"

export default function Page() {
  return <Sidebar client:load />
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
        HTML first and hydrate when it enters the viewport.
      </p>
      <CodeBlock
        lang="tsx"
        code={`import Comments from "@/components/comments"

export default function Page() {
  return <Comments client:visible />
}`}
      />

      <h2 id="client-idle">
        <code>client:idle</code>
      </h2>
      <p>
        Add <code>client:idle</code> when a component should render as static
        HTML first and hydrate after the browser has idle time.
      </p>
      <CodeBlock
        lang="tsx"
        code={`import Newsletter from "@/components/newsletter"

export default function Page() {
  return <Newsletter client:idle />
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
    </Doc>
  )
}
