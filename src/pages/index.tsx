import { TypographyInlineCode } from "@/components/ui/typography"
import Home from "@/components/layouts/home"

export default function HomePage() {
  return (
    <Home
      title="Sitex"
      description="A simpler React framework for building content sites."
      path="/"
      hero={{
        title:
          "A simpler, Vite-based React framework for building fast websites with local content.",
        description:
          "Sitex renders your React routes to fast static HTML by default, while island architecture lets you add browser interactivity exactly where a page needs it.",
        buttons: [{ href: "/docs/", label: "Read the introduction" }],
      }}
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
                <TypographyInlineCode>client:load</TypographyInlineCode> or{" "}
                <TypographyInlineCode>client:only</TypographyInlineCode>.
              </>
            ),
          },
        ],
      }}
    />
  )
}
