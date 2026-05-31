import { CodeBlock } from "@/components/ui/code-block"
import Doc from "@/components/layouts/doc"

export default function FolderStructurePage() {
  return (
    <Doc
      title="Folder structure"
      description="What Sitex requires and how we recommend organizing content sites."
      path="/docs/folder-structure"
      doc={{
        title: "Folder structure",
        description:
          "What Sitex requires and how we recommend organizing content sites.",
        tocItems: [
          { href: "#pages-folder", label: "pages folder for routing" },
          {
            href: "#components-folder",
            label: "components folder recommendations",
          },
          { href: "#layouts", label: "layouts", depth: 3 },
          { href: "#blocks", label: "blocks", depth: 3 },
          { href: "#ui", label: "ui", depth: 3 },
          { href: "#why-inline-content", label: "Why inline content" },
        ],
      }}
    >
      <CodeBlock
        lang="text"
        code={`src/
  components/
    layouts/
      base.tsx
      home.tsx
      doc.tsx
    blocks/
      hero-1.tsx
      features-1.tsx
      doc-1.tsx
      sidebar-1.tsx
    ui/
      button.tsx
      typography.tsx
  pages/
    index.tsx
    docs/
      index.tsx
      folder-structure.tsx`}
      />

      <h2 id="pages-folder">pages folder for routing</h2>
      <p>
        The only folder Sitex really cares about is <code>src/pages</code>.
        Files in this folder become routes.
      </p>
      <ol>
        <li>
          <code>src/pages/index.tsx</code> maps to <code>/</code>.
        </li>
        <li>
          <code>src/pages/docs/index.tsx</code> maps to <code>/docs/</code>.
        </li>
        <li>
          <code>src/pages/docs/folder-structure.tsx</code> maps to{" "}
          <code>/docs/folder-structure</code>.
        </li>
      </ol>
      <p>
        Keep route files thin. A route should choose a layout and pass content
        into it, not repeat the full page shell.
      </p>
      <p>
        Shared chrome belongs in layouts, reusable page sections belong in
        blocks, and low-level design pieces belong in UI components. This is an
        opinionated structure for maintainability, not a Sitex requirement.
      </p>

      <h2 id="components-folder">components folder recommendations</h2>
      <p>
        The <code>src/components</code> folder is a recommendation, not a Sitex
        requirement. We use three levels: layouts, blocks, and UI components.
      </p>

      <h3 id="layouts">layouts</h3>
      <p>
        Always start with <code>src/components/layouts/base.tsx</code> for the
        document shell, metadata, navigation, and site chrome.
      </p>
      <p>
        Add one layout file for each unique page shape, such as{" "}
        <code>home.tsx</code>, <code>doc.tsx</code>, <code>landing.tsx</code>,
        or <code>case-study.tsx</code>. Layouts compose blocks and decide the
        page-level structure.
      </p>

      <h3 id="blocks">blocks</h3>
      <p>
        Blocks live in <code>src/components/blocks</code>. A block is a reusable
        page section, such as a hero, feature grid, CTA, pricing table, article
        frame, or sidebar shell.
      </p>
      <p>
        Blocks own section-level layout and are mainly built from UI components.
      </p>

      <h3 id="ui">ui</h3>
      <p>
        UI components live in <code>src/components/ui</code>. These are
        low-level design system pieces: buttons, typography, inputs,
        breadcrumbs, tiles, and sidebar primitives.
      </p>
      <p>
        UI components should stay generic. They should not know about one route,
        one marketing page, or one content model.
      </p>

      <h2 id="why-inline-content">Why inline content</h2>
      <p>
        The reference app writes page content directly in TSX instead of loading
        structured content from Markdown files. That is an intentional tradeoff.
      </p>
      <ul>
        <li>
          <strong>TypeScript support:</strong> content can use the same
          components, props, and types as the rest of the app.
        </li>
        <li>
          <strong>Fast HMR:</strong> content is part of the Vite module graph,
          so editing a route or block feels like editing any other React
          component.
        </li>
        <li>
          <strong>HTML over Markdown:</strong> HTML and TSX can express richer
          layout, typed props, interactive examples, and real components. This
          matches the argument in{" "}
          <a href="https://www.ailinklab.com/en/develop/develop-html-over-markdown/">
            Stop Writing Markdown — Use HTML with Claude Code
          </a>
          .
        </li>
        <li>
          <strong>Less CMS pressure:</strong> AI can edit structured TSX content
          directly, so small marketing sites and documentation often do not need
          another content layer.
        </li>
      </ul>
    </Doc>
  )
}
