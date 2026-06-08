import { createElement } from "react"

import * as ReactDomClient from "react-dom/client"
import { islands } from "virtual:sitex-islands"

import {
  hydrationAttributes,
  type HydrationMode,
  isHydrationMode,
  parseHydrationProps,
} from "./protocol.ts"

type IdleWindow = Window &
  typeof globalThis & {
    requestIdleCallback?: (callback: IdleRequestCallback) => number
  }

const reactDomClient =
  (
    ReactDomClient as typeof ReactDomClient & {
      default?: typeof ReactDomClient
    }
  ).default ?? ReactDomClient

const scheduledEntries = new WeakSet<HTMLElement>()

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
  const staticChildrenElement = Array.from(element.children).find((child) =>
    child.hasAttribute(hydrationAttributes.staticChildren)
  )
  const staticChildrenHtml = staticChildrenElement?.innerHTML

  staticChildrenElement?.remove()

  const staticChildren = staticChildrenElement
    ? createElement("div", {
        [hydrationAttributes.staticChildren]: "",
        dangerouslySetInnerHTML: { __html: staticChildrenHtml },
      })
    : undefined

  if (mode === "only") {
    reactDomClient
      .createRoot(element)
      .render(createElement(Component, props, staticChildren))
    queueNestedHydrationScan(element)
    return
  }

  reactDomClient.hydrateRoot(
    element,
    createElement(Component, props, staticChildren)
  )
  queueNestedHydrationScan(element)
}

function scheduleHydrationEntry(element: HTMLElement, mode: HydrationMode) {
  if (scheduledEntries.has(element)) return

  scheduledEntries.add(element)

  if (mode === "visible") {
    if (!("IntersectionObserver" in window)) {
      void bootHydrationEntry(element)
      return
    }

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return

      observer.disconnect()
      void bootHydrationEntry(element)
    })

    observer.observe(element)
    return
  }

  if (mode === "idle") {
    const requestIdleCallback = (window as IdleWindow).requestIdleCallback

    if (requestIdleCallback) {
      requestIdleCallback(() => void bootHydrationEntry(element))
    } else {
      window.setTimeout(() => void bootHydrationEntry(element), 1)
    }

    return
  }

  if (mode === "media") {
    const media = element.getAttribute(hydrationAttributes.media)

    if (!media) return

    const mediaQuery = window.matchMedia(media)

    if (mediaQuery.matches) {
      void bootHydrationEntry(element)
      return
    }

    const hydrateWhenMatched = (event: MediaQueryListEvent) => {
      if (!event.matches) return

      mediaQuery.removeEventListener("change", hydrateWhenMatched)
      void bootHydrationEntry(element)
    }

    mediaQuery.addEventListener("change", hydrateWhenMatched)
    return
  }

  void bootHydrationEntry(element)
}

function queueNestedHydrationScan(element: HTMLElement) {
  window.setTimeout(() => scheduleHydrationEntries(element), 0)
}

function scheduleHydrationEntries(root: ParentNode) {
  if (
    root instanceof HTMLElement &&
    root.hasAttribute(hydrationAttributes.island)
  ) {
    const mode = root.getAttribute(hydrationAttributes.mode)

    if (isHydrationMode(mode)) {
      scheduleHydrationEntry(root, mode)
    }
  }

  for (const element of root.querySelectorAll<HTMLElement>(
    `[${hydrationAttributes.island}]`
  )) {
    const mode = element.getAttribute(hydrationAttributes.mode)

    if (isHydrationMode(mode)) {
      scheduleHydrationEntry(element, mode)
    }
  }
}

scheduleHydrationEntries(document)

new MutationObserver((records) => {
  for (const record of records) {
    for (const node of record.addedNodes) {
      if (node instanceof HTMLElement) {
        scheduleHydrationEntries(node)
      }
    }
  }
}).observe(document.documentElement, {
  childList: true,
  subtree: true,
})
