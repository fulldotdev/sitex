import Doc from "@/components/layouts/doc"

export default function PageRoutingPage() {
  return (
    <Doc
      title="Page routing"
      description="Map TSX files in the pages folder to static routes."
      path="/docs/page-routing"
      doc={{
        title: "Page routing",
        description: "Map TSX files in the pages folder to static routes.",
        tocItems: [
          { href: "#overview", label: "Overview" },
          { href: "#route-files", label: "Route files" },
          { href: "#index-routes", label: "Index routes" },
        ],
      }}
    >
      <h2 id="overview">Overview</h2>
      <p>
        Sitex uses file-based routing. TSX files in <code>src/pages</code>{" "}
        become static routes. This is the required part of the folder structure
        explained in <a href="/docs/folder-structure">Folder structure</a>.
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
          <code>src/pages/docs/index.tsx</code> becomes <code>/docs/</code>.
        </li>
      </ol>
    </Doc>
  )
}
