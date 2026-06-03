import Doc from "@/components/layouts/doc"

export const content = {
  title: "Introduction",
  description:
    "A simpler, Vite-based React framework for building fast websites with local content.",
  order: 1,
  tocItems: [
    { href: "#overview", label: "Overview" },
    { href: "#use-cases", label: "Use cases" },
    { href: "#sitex-versus-astro", label: "Sitex versus Astro" },
  ],
}

export default function IntroductionPage() {
  return (
    <Doc
      title={content.title}
      description={content.description}
      path="/docs"
      doc={content}
    >
      <h2 id="overview">Overview</h2>
      <p>
        Sitex renders React routes to fast static HTML by default, while island
        architecture lets you add browser interactivity exactly where a page
        needs it.
      </p>
      <p>
        Routes are local TSX files. Sitex maps them to URLs, keeps routing
        explicit and file-based. Read more in{" "}
        <a href="/docs/page-routing">Page routing</a>.
      </p>
      <p>
        Imported components can opt into client rendering with{" "}
        <code>client:load</code> or <code>client:only</code>. Read more in{" "}
        <a href="/docs/island-rendering">Island rendering</a>.
      </p>

      <h2 id="use-cases">Use cases</h2>
      <p>
        Sitex is intended for simple content-based websites like landing pages,
        marketing sites, and documentation. It is especially useful when that
        content site belongs to a larger product that also has an app-like
        dashboard built with something like Next.js or TanStack.
      </p>
      <p>
        In that setup, the content site can reuse the same React components and
        design system as the app, but render them statically instead of
        dynamically.
      </p>
      <p>
        We like building with the React ecosystem. We want to use React
        components, Vite, TypeScript, Shadcn/ui, and the rest of the ecosystem
        while still producing extremely fast websites.
      </p>

      <h2 id="sitex-versus-astro">Sitex versus Astro</h2>
      <p>
        We love Astro. Fulldev sponsors Astro monthly, and Sitex is mostly
        inspired by Astro's static-first model and island architecture.
      </p>
      <p>
        Astro already proves that this model works. Sitex is not trying to
        replace Astro; it is an experiment around one specific difference.
      </p>
      <p>
        In Astro, client directives are placed on framework components from
        inside Astro components. That can make it harder to build the whole
        website with React components, and you often end up with duplicate
        components in both <code>.astro</code> and <code>.tsx</code> syntax to
        work around that.
      </p>
      <p>
        Because of this, at Fulldev we've even built{" "}
        <a href="https://ui.full.dev">a UI library for Astro</a> to work around
        that limitation. Sitex is the experiment in the other direction: keep
        the Astro-inspired static output and island architecture, but let client
        directives be used from TSX so the app feels like a normal React and
        Vite project.
      </p>
    </Doc>
  )
}
