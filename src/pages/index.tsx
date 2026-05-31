import { Button } from "@/components/ui/button"
import { Section, SectionContainer } from "@/components/ui/section"
import { TypographyInlineCode } from "@/components/ui/typography"
import Base from "@/components/layouts/base"

export default function HomePage() {
  return (
    <Base
      title="Sitex"
      description="A simpler React framework for building content sites."
      path="/"
    >
      <Section className="py-12 sm:py-16">
        <SectionContainer className="max-w-4xl gap-10">
          <div className="flex max-w-3xl flex-col gap-5">
            <h1 className="text-foreground text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
              A simpler, Vite-based React framework for building fast websites
              with local content.
            </h1>
            <p className="text-muted-foreground max-w-2xl text-base leading-7 text-balance">
              Sitex renders your React routes to fast static HTML by default,
              while island architecture lets you add browser interactivity
              exactly where a page needs it.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button render={<a href="/docs/" />}>Read the introduction</Button>
          </div>

          <div className="border-border mt-2 grid gap-6 border-t pt-10 text-sm sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <h2 className="text-foreground font-medium">
                Zero bundle size by default
              </h2>
              <p className="text-muted-foreground leading-6">
                Content routes ship as static HTML unless you explicitly add an
                island.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-foreground font-medium">
                File-based routing
              </h2>
              <p className="text-muted-foreground leading-6">
                Add plain TSX files under{" "}
                <TypographyInlineCode>src/pages</TypographyInlineCode>. Sitex
                maps them to URLs and keeps routing explicit.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-foreground font-medium">
                Interactive islands when needed
              </h2>
              <p className="text-muted-foreground leading-6">
                Add client rendering at imported component boundaries with{" "}
                <TypographyInlineCode>client:load</TypographyInlineCode> or{" "}
                <TypographyInlineCode>client:only</TypographyInlineCode>.
              </p>
            </div>
          </div>
        </SectionContainer>
      </Section>
    </Base>
  )
}
