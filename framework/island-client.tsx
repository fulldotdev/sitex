import { createElement } from "react"
import { flushSync } from "react-dom"
import { createRoot, hydrateRoot } from "react-dom/client"

import { islands } from "virtual:ostra-islands"

async function bootIsland(element: HTMLElement) {
  const id = element.dataset.ostraIsland
  const mode = element.dataset.ostraMode

  if (!id || (mode !== "load" && mode !== "only")) return

  const loadIsland = islands[id]

  if (!loadIsland) {
    console.warn(`[ostra] No client island registered for "${id}".`)
    return
  }

  const mod = await loadIsland()
  const Component = mod.default
  const props = element.dataset.ostraProps
    ? JSON.parse(element.dataset.ostraProps)
    : {}
  const staticChildren = element.dataset.ostraChildren
    ? createElement("div", {
        "data-ostra-static-children": "",
        dangerouslySetInnerHTML: { __html: element.dataset.ostraChildren },
      })
    : undefined

  if (mode === "only") {
    flushSync(() => {
      createRoot(element).render(createElement(Component, props, staticChildren))
    })
    return
  }

  hydrateRoot(element, createElement(Component, props, staticChildren))
}

for (const element of document.querySelectorAll<HTMLElement>("[data-ostra-island]")) {
  void bootIsland(element)
}
