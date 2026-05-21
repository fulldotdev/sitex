import { Counter } from "../components/counter"
import { Layout } from "../components/layout"
import { globals } from "../content/globals"

export const meta = {
  title: "Hydration examples",
}

export default function ExamplesPage() {
  return (
    <Layout global={globals.en}>
      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-semibold">{meta.title}</h1>
          <p className="mt-4 text-zinc-300">
            The same Counter component is rendered three ways so the difference
            between static HTML, client:load, and client:only is visible.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
            <p className="mb-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
              No directive
            </p>
            <Counter
              description="This is server-rendered HTML only. The button is visible, but no click handler is attached."
              initialCount={0}
              label="Static count"
              title="Static counter"
            >
              <Counter
                description="Nested inside a static parent. This should stay visible, but also stay static."
                initialCount={1}
                label="Static child count"
                title="Static child counter"
              />
            </Counter>
          </section>

          <section className="rounded-lg border border-teal-500/40 bg-teal-950/20 p-6">
            <p className="mb-4 text-xs font-medium uppercase tracking-wide text-teal-300">
              client:load
            </p>
            <Counter
              client:load
              description="This is present in the initial HTML and then hydrated. The button increments."
              initialCount={10}
              label="Hydrated count"
              title="Hydrated counter"
            >
              <Counter
                description="Nested inside client:load. This tests whether children stay as static slot content after hydration."
                initialCount={11}
                label="Load child count"
                title="client:load child counter"
              />
            </Counter>
          </section>

          <section className="rounded-lg border border-fuchsia-500/40 bg-fuchsia-950/20 p-6">
            <p className="mb-4 text-xs font-medium uppercase tracking-wide text-fuchsia-300">
              client:only
            </p>
            <Counter
              client:only
              description="This is not rendered on the server. It appears only after the browser loads the island."
              initialCount={20}
              label="Browser count"
              title="Browser-only counter"
            >
              <Counter
                description="Nested inside client:only. This tests whether children can appear when the parent has no server HTML."
                initialCount={21}
                label="Only child count"
                title="client:only child counter"
              />
            </Counter>
          </section>
        </div>

        <section className="mt-10 rounded-lg border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="text-xl font-semibold">What to inspect</h2>
          <div className="mt-4 grid gap-4 text-sm leading-6 text-zinc-300 md:grid-cols-3">
            <p>
              The static counter has no data-ostra-island wrapper. It is just
              server HTML, including its child slot, and the buttons do not
              increment.
            </p>
            <p>
              The client:load counter has server HTML plus a data-ostra-island
              wrapper. Its own button increments; the nested child shows whether
              slot content survives hydration.
            </p>
            <p>
              The client:only counter has a data-ostra-island wrapper with no
              server HTML inside it. Its nested child shows whether children can
              exist when there was no server slot.
            </p>
          </div>
        </section>

        <section className="mt-10 rounded-lg border border-zinc-800 p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-teal-300">
            Another client:load instance
          </p>
          <div className="mt-4">
            <Counter
              client:load
              description="A second hydrated counter shows that multiple islands of the same component work independently."
              initialCount={100}
              label="Second count"
              title="Second hydrated counter"
            >
              <Counter
                description="Nested inside the second client:load counter, so we can compare repeated slot behavior."
                initialCount={101}
                label="Second child count"
                title="Second child counter"
              />
            </Counter>
          </div>
        </section>
      </main>
    </Layout>
  )
}
