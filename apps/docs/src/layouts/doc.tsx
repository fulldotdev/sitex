import type { MarkdownLayoutProps } from "@fulldotdev/sitex"

import DocLayout from "@/components/layouts/doc"
import { docsNavigation } from "@/components/layouts/base"

type TocItem = {
  depth?: number
  href: string
  label: string
}

type DocFrontmatter = {
  title: string
  description: string
  order?: number
  tocItems?: readonly TocItem[]
}

function findPathByTitle(title: string) {
  return docsNavigation.find((item) => item.label === title)?.href ?? "/"
}

export default function DocMdxLayout({
  title,
  description,
  headings,
  tocItems,
  children,
}: MarkdownLayoutProps<DocFrontmatter>) {
  const doc = {
    title,
    description,
    tocItems: tocItems ? [...tocItems] : headings ? [...headings] : undefined,
  }

  return (
    <DocLayout
      title={title}
      description={description}
      path={findPathByTitle(title)}
      doc={doc}
    >
      {children}
    </DocLayout>
  )
}
