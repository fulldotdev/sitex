import { getEntry } from "ostra/content"

import { Counter } from "../components/counter"
import { Layout } from "../components/layout"
import { globals } from "../content/globals"

export const meta = {
  title: "Home",
}

export default async function HomePage() {
  const page = await getEntry("pages", "index")
  const hero =
    page?.data.type === "home"
      ? page.data.hero
      : {
          title: meta.title,
          description: "This page is rendered from a static file-based page component.",
        }

  return (
    <Layout global={globals.en}>
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-4xl font-semibold">{hero.title}</h1>
        <p className="mt-4 max-w-2xl text-zinc-300">{hero.description}</p>
        {page?.body ? (
          <div className="mt-8 max-w-2xl text-zinc-300">{page.body}</div>
        ) : null}
        <div className="mt-10 rounded-lg border border-zinc-800 p-6">
          <Counter client:load initialCount={0} />
        </div>
      </main>
    </Layout>
  )
}
