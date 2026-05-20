import type { LayoutProps } from "ostra/layout"

import { HeroBlock } from "../components/blocks/hero"
import { Newsletter } from "../components/newsletter"

export default function HomeLayout({
  page,
  global,
  content,
}: LayoutProps<"home">) {
  return (
    <main>
      <HeroBlock {...page.hero} />
      <section className="mx-auto grid max-w-5xl gap-8 px-6 py-12 md:grid-cols-[1fr_22rem]">
        <article
          className="max-w-none space-y-4 leading-7 text-zinc-300 [&_code]:rounded [&_code]:bg-zinc-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:text-zinc-100 [&_li]:ml-5 [&_li]:list-disc"
          dangerouslySetInnerHTML={{ __html: content }}
        />
        <Newsletter {...page.newsletter} />
      </section>
    </main>
  )
}
