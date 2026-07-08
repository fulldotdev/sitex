import type { LayoutProps } from "@fulldotdev/sitex"
import type { ComponentProps } from "react"

import { Doc1 } from "@/components/blocks/doc-1"
import BaseLayout from "@/layouts/base"
import { docsNavigation } from "@/lib/globals"

type TocItem = {
  depth?: number
  href: string
  label: string
}

type DocData = {
  tocItems?: readonly TocItem[]
}

function normalizePath(path: string) {
  if (path === "/") return path

  return path.replace(/\/$/, "")
}

export default function DocMdxLayout({
  title,
  description,
  headings,
  tocItems,
  children,
  path,
  url,
  locale,
  image,
  jsonLd,
  publishedAt,
  type,
  updatedAt,
}: LayoutProps<DocData>) {
  const doc = {
    title,
    description,
    tocItems: tocItems ? [...tocItems] : headings ? [...headings] : undefined,
  } satisfies Omit<
    ComponentProps<typeof Doc1>,
    "children" | "previousPage" | "nextPage"
  >
  const currentPath = normalizePath(path)
  const currentIndex = docsNavigation.findIndex(
    (item) => normalizePath(item.href) === currentPath
  )
  const previousPage =
    currentIndex > 0 ? docsNavigation[currentIndex - 1] : undefined
  const nextPage =
    currentIndex >= 0 ? docsNavigation[currentIndex + 1] : undefined

  return (
    <BaseLayout
      title={title}
      description={description}
      headings={headings}
      image={image}
      jsonLd={jsonLd}
      locale={locale}
      path={path}
      publishedAt={publishedAt}
      type={type}
      updatedAt={updatedAt}
      url={url}
    >
      <Doc1 {...doc} previousPage={previousPage} nextPage={nextPage}>
        {children}
      </Doc1>
    </BaseLayout>
  )
}
