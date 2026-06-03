import React, { type ComponentType, type ReactNode } from "react"
import { prerender } from "react-dom/static"

import {
  hydrationAttributes,
  serializeHydrationProps,
  type HydrationMode,
} from "./protocol.ts"

type Props = {
  component: ComponentType<Record<string, unknown>>
  id: string
  mode: HydrationMode
  props: Record<string, unknown>
  children?: ReactNode
}

async function renderStaticMarkup(node: ReactNode) {
  const { prelude } = await prerender(node)

  return new Response(prelude).text()
}

export async function SitexIsland({
  component: Component,
  id,
  mode,
  props,
  children,
}: Props) {
  const serializedProps = serializeHydrationProps(props)
  const staticChildrenHtml = children ? await renderStaticMarkup(children) : ""
  const staticChildren = staticChildrenHtml ? (
    <div
      dangerouslySetInnerHTML={{ __html: staticChildrenHtml }}
      {...{ [hydrationAttributes.staticChildren]: "" }}
    />
  ) : null

  return (
    <div
      {...{
        [hydrationAttributes.children]: staticChildrenHtml,
        [hydrationAttributes.island]: id,
        [hydrationAttributes.mode]: mode,
        [hydrationAttributes.props]: serializedProps,
      }}
    >
      {mode === "load" ? (
        <Component {...props}>{staticChildren}</Component>
      ) : null}
    </div>
  )
}
