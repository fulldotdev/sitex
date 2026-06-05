import Home from "@/components/layouts/home"
import { TypographyInlineCode } from "@/components/ui/typography"

export const data = {
  title: "Sitex",
  description: "A simpler React framework for building content sites.",
  hero: {
    title:
      "A simpler, Vite-based React framework for building fast websites with local data.",
    description:
      "Sitex renders your React routes to fast static HTML by default, while island architecture lets you add browser interactivity exactly where a page needs it.",
    buttons: [{ href: "/docs", label: "Read the introduction" }],
  },
}

export default function HomePage() {
  return (
    <Home
      title={data.title}
      description={data.description}
      path="/"
      hero={data.hero}
      features={{
        features: [
          {
            title: "Zero bundle size by default",
            description:
              "Content routes ship as static HTML unless you explicitly add an island.",
          },
          {
            title: "File-based routing",
            description: (
              <>
                Add plain TSX files under{" "}
                <TypographyInlineCode>src/pages</TypographyInlineCode>. Sitex
                maps them to URLs and keeps routing explicit.
              </>
            ),
          },
          {
            title: "Interactive islands when needed",
            description: (
              <>
                Add client rendering at imported component boundaries with{" "}
                <TypographyInlineCode>client:load</TypographyInlineCode>,{" "}
                <TypographyInlineCode>client:visible</TypographyInlineCode>, or{" "}
                <TypographyInlineCode>client:idle</TypographyInlineCode>.
              </>
            ),
          },
        ],
      }}
    />
  )
}
