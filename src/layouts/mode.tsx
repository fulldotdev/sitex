import type { LayoutProps } from "ostra/layout"

import { Counter } from "../components/counter"
import { Newsletter } from "../components/newsletter"

type Props =
  | LayoutProps<"static-none">
  | LayoutProps<"static-load">
  | LayoutProps<"server-none">
  | LayoutProps<"server-load">
  | LayoutProps<"none-load">

export default function ModeLayout({ page, content, render }: Props) {
  return (
    <main className="mx-auto grid max-w-5xl gap-8 px-6 py-16 md:grid-cols-[1fr_22rem]">
      <section>
        <p className="mb-3 text-sm font-medium uppercase tracking-wide text-teal-300">
          output: {page.output} / client: {page.client}
        </p>
        <h1 className="text-4xl font-semibold tracking-normal">{page.title}</h1>
        <p className="mt-4 text-lg text-zinc-300">{page.description}</p>
        <article
          className="mt-10 max-w-none space-y-4 leading-7 text-zinc-300 [&_code]:rounded [&_code]:bg-zinc-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:text-zinc-100 [&_li]:ml-5 [&_li]:list-disc"
          dangerouslySetInnerHTML={{ __html: content }}
        />
        <dl className="mt-10 grid gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-5 text-sm text-zinc-300">
          <div>
            <dt className="font-medium text-zinc-100">Rendered at</dt>
            <dd>{render.at}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-100">Output mode</dt>
            <dd>{render.output}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-100">Client mode</dt>
            <dd>{render.client}</dd>
          </div>
        </dl>
      </section>
      <aside className="grid gap-5">
        <Counter initialCount={0} />
        {page.newsletter ? (
          <Newsletter {...page.newsletter} />
        ) : (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 text-sm leading-6 text-zinc-300">
            Newsletter props are not configured for this page.
          </div>
        )}
      </aside>
    </main>
  )
}
