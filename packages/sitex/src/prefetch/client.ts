/**
 * Fallback link prefetcher for browsers without the Speculation Rules API.
 * Sitex injects a speculationrules script alongside this module; browsers
 * that support it prerender links natively and this module stays idle.
 */
const prefetchedUrls = new Set<string>()

function supportsSpeculationRules() {
  return (
    "supports" in HTMLScriptElement &&
    HTMLScriptElement.supports("speculationrules")
  )
}

function saveDataEnabled() {
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection

  return connection?.saveData === true
}

function readPrefetchableUrl(target: EventTarget | null) {
  if (!(target instanceof Element)) return

  const anchor = target.closest("a[href]")

  if (!(anchor instanceof HTMLAnchorElement)) return
  if (anchor.target && anchor.target !== "_self") return
  if (anchor.hasAttribute("download")) return
  if (anchor.closest("[data-no-prefetch]")) return

  const url = new URL(anchor.href, location.href)

  if (url.origin !== location.origin) return
  if (url.pathname === location.pathname && url.search === location.search) {
    return
  }

  return url
}

function prefetch(url: URL) {
  const href = url.pathname + url.search

  if (prefetchedUrls.has(href)) return

  prefetchedUrls.add(href)

  const link = document.createElement("link")

  link.rel = "prefetch"
  link.href = href
  document.head.appendChild(link)
}

function onIntent(event: Event) {
  const url = readPrefetchableUrl(event.target)

  if (url) prefetch(url)
}

if (!supportsSpeculationRules() && !saveDataEnabled()) {
  document.addEventListener("mouseover", onIntent, { passive: true })
  document.addEventListener("touchstart", onIntent, { passive: true })
  document.addEventListener("focusin", onIntent, { passive: true })
}
