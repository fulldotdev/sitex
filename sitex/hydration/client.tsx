import { createElement } from "react"
import { flushSync } from "react-dom"
import { createRoot, hydrateRoot } from "react-dom/client"
import { islands } from "virtual:sitex-islands"

import {
  hydrationAttributes,
  isHydrationMode,
  parseHydrationProps,
} from "./protocol.ts"

async function bootHydrationEntry(element: HTMLElement) {
  const id = element.getAttribute(hydrationAttributes.island)
  const mode = element.getAttribute(hydrationAttributes.mode)

  if (!id || !isHydrationMode(mode)) return

  const loadEntry = islands[id]

  if (!loadEntry) {
    console.warn(`[sitex] No client island registered for "${id}".`)
    return
  }

  const mod = await loadEntry()
  const Component = mod.default
  const props = parseHydrationProps(
    element.getAttribute(hydrationAttributes.props)
  )
  const staticChildrenHtml = element.getAttribute(hydrationAttributes.children)
  const staticChildren = staticChildrenHtml
    ? createElement("div", {
        [hydrationAttributes.staticChildren]: "",
        dangerouslySetInnerHTML: { __html: staticChildrenHtml },
      })
    : undefined

  if (mode === "only") {
    flushSync(() => {
      createRoot(element).render(
        createElement(Component, props, staticChildren)
      )
    })
    return
  }

  hydrateRoot(element, createElement(Component, props, staticChildren))
}

for (const element of document.querySelectorAll<HTMLElement>(
  `[${hydrationAttributes.island}]`
)) {
  void bootHydrationEntry(element)
}
