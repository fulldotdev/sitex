import type { ComponentType, ReactNode } from "react"

import {
  hydrationAttributes,
  serializeHydrationProps,
  type HydrationMode,
} from "./protocol.ts"

type Props = {
  component: ComponentType<Record<string, unknown>>
  id: string
  media?: string
  mode: HydrationMode
  props: Record<string, unknown>
  children?: ReactNode
}

/**
 * Browser-side counterpart of the server SitexIsland wrapper.
 *
 * When an island component itself contains a `client:*` directive, the parent
 * island's bundle renders this wrapper instead of the server one, so the
 * browser bundle never pulls in react-dom/static. The wrapper reproduces the
 * island element only; its content stays owned by the nested island root that
 * the hydration client boots for it, the same way static children work.
 */
export function SitexIsland({ id, media, mode, props }: Props) {
  return (
    <div
      {...{
        [hydrationAttributes.island]: id,
        [hydrationAttributes.media]: media,
        [hydrationAttributes.mode]: mode,
        [hydrationAttributes.props]: serializeHydrationProps(props),
      }}
      dangerouslySetInnerHTML={{ __html: "" }}
      suppressHydrationWarning
    />
  )
}
