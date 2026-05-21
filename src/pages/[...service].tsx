import { getCollection } from "ostra/content"
import { definePages } from "ostra/pages"

import { Counter } from "../components/counter"
import { Layout } from "../components/layout"
import { globals } from "../content/globals"

const services = await getCollection("pages", ({ id }) => id.startsWith("services/"))

export default definePages({
  entries: [...services]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((entry) => ({
      service: entry.id,
      title: entry.data.title,
      description: entry.data.description,
      body: entry.body,
      global: globals.en,
    })),

  layout: (props) => (
    <Layout global={props.global}>
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-4xl font-semibold">{props.title}</h1>
        <p className="mt-4 max-w-2xl text-zinc-300">{props.description}</p>
        <p className="mt-4 text-sm text-zinc-500">Service: {props.service}</p>
        <div className="mt-8 max-w-2xl text-zinc-300">{props.body}</div>
        <div className="mt-10 rounded-lg border border-zinc-800 p-6">
          <Counter client:load initialCount={1} />
        </div>
      </main>
    </Layout>
  ),
})
