import type { ReactNode } from "react"
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Section, SectionContainer } from "@/components/ui/section"
import { Separator } from "@/components/ui/separator"
import {
  Toc,
  TocMenu,
  TocMenuItem,
  TocMenuLink,
  TocTitle,
} from "@/components/ui/toc"
import { Typography } from "@/components/ui/typography"

type DocPageLink = {
  href: string
  label: string
}

type Props = {
  title: string
  description: string
  children: ReactNode
  tocItems?: {
    depth?: number
    href: string
    label: string
  }[]
  previousPage?: DocPageLink
  nextPage?: DocPageLink
}

function DocPaginationPrevious({ page }: { page?: DocPageLink }) {
  if (!page) {
    return <div aria-hidden="true" />
  }

  return (
    <Button
      className="h-auto min-w-0 justify-start gap-2 px-3 py-2 whitespace-normal"
      render={<a href={page.href} />}
      variant="outline"
    >
      <ArrowLeftIcon data-icon="inline-start" />
      <span className="truncate text-sm font-medium">{page.label}</span>
    </Button>
  )
}

function DocPaginationNext({ page }: { page?: DocPageLink }) {
  if (!page) {
    return <div aria-hidden="true" />
  }

  return (
    <Button
      className="h-auto min-w-0 justify-end gap-2 px-3 py-2 text-right whitespace-normal"
      render={<a href={page.href} />}
      variant="outline"
    >
      <span className="truncate text-sm font-medium">{page.label}</span>
      <ArrowRightIcon data-icon="inline-end" />
    </Button>
  )
}

function Doc1({
  title,
  description,
  children,
  tocItems = [
    { href: "#overview", label: "Overview" },
    { href: "#example", label: "Example" },
  ],
  previousPage,
  nextPage,
}: Props) {
  return (
    <Section className="py-8">
      <SectionContainer className="grid gap-10 pt-6 pb-4 sm:pt-8 sm:pb-6 xl:grid-cols-[minmax(0,1fr)_16rem] xl:items-start xl:gap-x-16">
        <div className="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-10">
          <header className="flex min-w-0 flex-col gap-2">
            <h1 className="text-foreground text-3xl leading-tight font-semibold tracking-tight">
              {title}
            </h1>
            <p className="text-muted-foreground max-w-2xl text-base leading-7">
              {description}
            </p>
          </header>
          <Separator />
          <Typography as="article" size="sm" className="min-w-0">
            {children}
          </Typography>
          <nav
            className="flex items-center justify-between gap-3"
            aria-label="Document pagination"
          >
            <DocPaginationPrevious page={previousPage} />
            <DocPaginationNext page={nextPage} />
          </nav>
        </div>
        {tocItems.length > 0 && (
          <aside className="sticky top-8 hidden xl:block">
            <Toc aria-label="On this page">
              <TocTitle>On this page</TocTitle>
              <TocMenu>
                {tocItems.map((item) => (
                  <TocMenuItem key={item.href}>
                    <TocMenuLink href={item.href} depth={item.depth}>
                      {item.label}
                    </TocMenuLink>
                  </TocMenuItem>
                ))}
              </TocMenu>
            </Toc>
          </aside>
        )}
      </SectionContainer>
    </Section>
  )
}

export { Doc1 }
