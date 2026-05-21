import { Counter } from "../components/counter"
import { Layout } from "../components/layout"
import { globals } from "../content/globals"

export const meta = {
  title: "Contact",
}

export default function ContactPage() {
  return (
    <Layout global={globals.en}>
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-4xl font-semibold">{meta.title}</h1>
        <p className="mt-4 text-zinc-300">
          This page keeps the current browser URL working after the page refactor.
        </p>
        <div className="mt-10 rounded-lg border border-zinc-800 p-6">
          <Counter client:load initialCount={2} />
        </div>
      </main>
    </Layout>
  )
}
