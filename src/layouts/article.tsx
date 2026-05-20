import type { LayoutProps } from "ostra/layout"

export default function ArticleLayout({ page, content }: LayoutProps<"article">) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-teal-300">
        Article
      </p>
      <h1 className="text-4xl font-semibold tracking-normal">{page.title}</h1>
      <p className="mt-4 text-lg text-zinc-300">{page.description}</p>
      <article
        className="mt-10 max-w-none space-y-4 leading-7 text-zinc-300 [&_code]:rounded [&_code]:bg-zinc-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:text-zinc-100 [&_li]:ml-5 [&_li]:list-disc"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </main>
  )
}
