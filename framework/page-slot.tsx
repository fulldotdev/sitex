import type { ReactNode } from "react"

type Props = {
  children?: ReactNode
  html?: string
}

export function PageSlot({ children, html }: Props) {
  if (html !== undefined) {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: html }}
        id="ostra-page"
        suppressHydrationWarning
      />
    )
  }

  return <div id="ostra-page">{children}</div>
}
