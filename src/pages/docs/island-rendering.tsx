import { CodeBlock } from "@/components/ui/code-block"
import Doc from "@/components/layouts/doc"

export const content = {
  title: "Island rendering",
  description: "Client rendering with explicit island boundaries.",
  order: 5,
  tocItems: [
    { href: "#overview", label: "Overview" },
    { href: "#client-load", label: "client:load" },
    { href: "#client-only", label: "client:only" },
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
