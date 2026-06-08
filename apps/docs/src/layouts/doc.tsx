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

function findPath(path: string | undefined, order: number | undefined) {
  if (path) return path
  if (order !== undefined) return docsNavigation[order - 1]?.href ?? "/"

  return "/"
}

export default function DocMdxLayout({
  title,
  description,
  headings,
  order,
  path,
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
      path={findPath(path, order)}
      doc={doc}
    >
      {children}
    </DocLayout>
  )
}
