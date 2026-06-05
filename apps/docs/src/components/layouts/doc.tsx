import type { ComponentProps } from "react"

import { Doc1 } from "@/components/blocks/doc-1"
import Base, { docsNavigation } from "@/components/layouts/base"

type Props = ComponentProps<typeof Base> & {
  doc: Omit<
    ComponentProps<typeof Doc1>,
    "children" | "previousPage" | "nextPage"
  >
}

function normalizePath(path: string) {
  if (path === "/") return path

  return path.replace(/\/$/, "")
}

export default function Doc({ doc, path = "/", children, ...props }: Props) {
  const currentPath = normalizePath(path)
  const currentIndex = docsNavigation.findIndex(
    (item) => normalizePath(item.href) === currentPath
  )
  const previousPage =
    currentIndex > 0 ? docsNavigation[currentIndex - 1] : undefined
  const nextPage =
    currentIndex >= 0 ? docsNavigation[currentIndex + 1] : undefined

  return (
    <Base path={path} {...props}>
      <Doc1 {...doc} previousPage={previousPage} nextPage={nextPage}>
        {children}
      </Doc1>
    </Base>
  )
}
