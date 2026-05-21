import type { ComponentType, ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"

type IslandMode = "load" | "only"

type Props = {
  component: ComponentType<Record<string, unknown>>
  id: string
  mode: IslandMode
  props: Record<string, unknown>
  children?: ReactNode
}

export function OstraIsland({
  component: Component,
  id,
  mode,
  props,
  children,
}: Props) {
  const serializedProps = JSON.stringify(props).replaceAll("<", "\\u003c")
  const staticChildrenHtml = children ? renderToStaticMarkup(children) : ""
  const staticChildren = staticChildrenHtml ? (
    <div
      data-ostra-static-children=""
      dangerouslySetInnerHTML={{ __html: staticChildrenHtml }}
    />
  ) : null

  return (
    <div
      data-ostra-children={staticChildrenHtml}
      data-ostra-island={id}
      data-ostra-mode={mode}
      data-ostra-props={serializedProps}
    >
      {mode === "load" ? (
        <Component {...props}>{staticChildren}</Component>
      ) : null}
    </div>
  )
}
