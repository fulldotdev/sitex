import Doc from "@/components/layouts/doc"

export const content = {
  title: "Page routing",
  description: "Map TSX files in the pages folder to static routes.",
  order: 3,
  tocItems: [
    { href: "#overview", label: "Overview" },
    { href: "#route-files", label: "Route files" },
    { href: "#index-routes", label: "Index routes" },
    { href: "#dynamic-routes", label: "Dynamic routes" },
    { href: "#server-routes", label: "Server routes" },
  ],
}

export default function PageRoutingPage() {
  return (
    <Doc
      title={content.title}
      description={content.description}
      path="/docs/page-routing"
      doc={content}
    >
      <h2 id="overview">Overview</h2>
      <p>
        Sitex uses file-based routing. TSX files in <code>src/pages</code>{" "}
        become static routes. This is the required part of the folder structure
        explained in <a href="/docs/folder-structure">Folder structure</a>.
      </p>
      <p>
        Routes are static unless they export <code>render = "server"</code>. See{" "}
        <a href="/docs/rendering-and-assets">Rendering and assets</a> for how
        static and server routes are rendered.
      </p>

      <h2 id="route-files">Route files</h2>
      <p>
        A route file exports the page component for one URL. The component can
        return any valid TSX document tree.
      </p>
      <ol>
        <li>
          <code>src/pages/about.tsx</code> becomes <code>/about</code>.
        </li>
        <li>
          <code>src/pages/docs/page-routing.tsx</code> becomes{" "}
          <code>/docs/page-routing</code>.
        </li>
      </ol>

      <h2 id="index-routes">Index routes</h2>
      <p>
        An <code>index.tsx</code> file maps to its parent folder. This keeps
        root pages and section landing pages explicit.
      </p>
      <ol>
        <li>
          <code>src/pages/index.tsx</code> becomes <code>/</code>.
        </li>
        <li>
          <code>src/pages/docs/index.tsx</code> becomes <code>/docs</code>.
        </li>
      </ol>

      <h2 id="dynamic-routes">Dynamic routes</h2>
      <p>
        A route segment wrapped in brackets becomes a route parameter. Static
        dynamic routes must export <code>paths</code>, so Sitex knows which HTML
        files to build.
      </p>
      <ol>
        <li>
          <code>src/pages/blog/[slug].tsx</code> can become{" "}
          <code>/blog/hello-world</code>.
        </li>
        <li>
          Each entry in <code>paths</code> provides the params for one generated
          page.
        </li>
      </ol>

      <h2 id="server-routes">Server routes</h2>
      <p>
        Export <code>render = "server"</code> for request-time routes. Server
        routes can read the incoming <code>request</code> from page context and
        are not written as static HTML files.
      </p>
    </Doc>
  )
}
