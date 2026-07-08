import { prerender } from "react-dom/static"
import { getRoutes } from "virtual:sitex-routes"

import { hydrationAttributes } from "../hydration/protocol.ts"
import {
  resolveRouteLocale,
  routePathToPublicPath,
  type Route,
} from "../router/runtime.ts"
import {
  appendElement,
  appendHtmlFragment,
  escapeHtmlAttribute,
  findElements,
  getAttribute,
  hasHeadElement,
  parseHtmlDocument,
  removeElement,
  serializeHtmlDocument,
  setAttribute,
  type HtmlDocument,
} from "./html.ts"

export type RenderConfig = {
  defaultLocale: string
  faviconHref?: string
  locales: readonly string[]
  siteUrl: string
  trailingSlash: boolean
}

export type RenderAssets = {
  islandClientPreamble?: string
  islandClientSrc?: string
  stylesheetHrefs?: readonly string[]
}

export type ResolveRenderAssets = (page: {
  hasIslands: boolean
}) => RenderAssets

const generatorMeta = `<meta name="generator" content="Sitex">`

export { getRoutes }

export async function renderRoute(
  route: Route,
  config: RenderConfig,
  resolveAssets?: ResolveRenderAssets
): Promise<string> {
  const node = await route.component()
  const source = await new Response((await prerender(node)).prelude).text()
  const htmlDocument = parseHtmlDocument(source)

  hoistJsonLdScripts(htmlDocument)
  applyDocumentLocale(htmlDocument, route, config)
  applyHeadDefaults(htmlDocument, route, config)

  const hasIslands = hasIslandElements(htmlDocument)
  const assets = resolveAssets?.({ hasIslands }) ?? {}

  injectStylesheets(htmlDocument, assets)
  injectIslandClient(htmlDocument, hasIslands, assets)

  return serializeHtmlDocument(htmlDocument)
}

/**
 * JSON-LD scripts render inline where layouts place them, but belong in the
 * document head.
 */
function hoistJsonLdScripts(htmlDocument: HtmlDocument) {
  const scripts = findElements(
    htmlDocument.body,
    (element) =>
      element.tagName === "script" &&
      getAttribute(element, "type") === "application/ld+json"
  )

  for (const script of scripts) {
    removeElement(script)
    appendElement(htmlDocument.head, script)
  }
}

function applyDocumentLocale(
  htmlDocument: HtmlDocument,
  route: Route,
  config: RenderConfig
) {
  if (getAttribute(htmlDocument.html, "lang")) return

  setAttribute(
    htmlDocument.html,
    "lang",
    resolveRouteLocale(route.path, config.locales, config.defaultLocale)
  )
}

function applyHeadDefaults(
  htmlDocument: HtmlDocument,
  route: Route,
  config: RenderConfig
) {
  const { head } = htmlDocument
  const url =
    typeof route.data.canonical === "string"
      ? route.data.canonical
      : createPageUrl(route.path, config)
  const tags: string[] = []

  const hasCharset = hasHeadElement(
    head,
    "meta",
    (element) =>
      getAttribute(element, "charset") !== undefined ||
      getAttribute(element, "http-equiv")?.toLowerCase() === "content-type"
  )

  if (!hasCharset) tags.push(`<meta charset="utf-8">`)

  if (!hasNamedMeta(head, "viewport")) {
    tags.push(
      `<meta name="viewport" content="width=device-width, initial-scale=1">`
    )
  }

  if (!hasLinkRel(head, "canonical")) {
    tags.push(`<link rel="canonical" href="${escapeHtmlAttribute(url)}">`)
  }

  if (!hasPropertyMeta(head, "og:url")) {
    tags.push(`<meta property="og:url" content="${escapeHtmlAttribute(url)}">`)
  }

  if (route.data.noindex === true && !hasNamedMeta(head, "robots")) {
    tags.push(`<meta name="robots" content="noindex">`)
  }

  if (config.faviconHref && !hasLinkRel(head, "icon")) {
    tags.push(
      `<link rel="icon" href="${escapeHtmlAttribute(config.faviconHref)}" type="image/svg+xml">`
    )
  }

  if (!hasNamedMeta(head, "generator")) tags.push(generatorMeta)

  if (tags.length > 0) appendHtmlFragment(head, tags.join(""))
}

function hasNamedMeta(head: HtmlDocument["head"], name: string) {
  return hasHeadElement(
    head,
    "meta",
    (element) => getAttribute(element, "name")?.toLowerCase() === name
  )
}

function hasPropertyMeta(head: HtmlDocument["head"], property: string) {
  return hasHeadElement(
    head,
    "meta",
    (element) => getAttribute(element, "property")?.toLowerCase() === property
  )
}

function hasLinkRel(head: HtmlDocument["head"], token: string) {
  return hasHeadElement(head, "link", (element) => {
    const rel = getAttribute(element, "rel")?.toLowerCase() ?? ""

    return rel.split(/\s+/).some((entry) => entry.includes(token))
  })
}

function hasIslandElements(htmlDocument: HtmlDocument) {
  return (
    findElements(
      htmlDocument.body,
      (element) =>
        getAttribute(element, hydrationAttributes.island) !== undefined
    ).length > 0
  )
}

function injectStylesheets(htmlDocument: HtmlDocument, assets: RenderAssets) {
  const hrefs = new Set(assets.stylesheetHrefs ?? [])

  if (hrefs.size === 0) return

  appendHtmlFragment(
    htmlDocument.head,
    [...hrefs]
      .map(
        (href) => `<link href="${escapeHtmlAttribute(href)}" rel="stylesheet">`
      )
      .join("")
  )
}

function injectIslandClient(
  htmlDocument: HtmlDocument,
  hasIslands: boolean,
  assets: RenderAssets
) {
  if (!hasIslands || !assets.islandClientSrc) return

  appendHtmlFragment(
    htmlDocument.body,
    `${assets.islandClientPreamble ?? ""}<script src="${escapeHtmlAttribute(assets.islandClientSrc)}" type="module"></script>`
  )
}

function createPageUrl(routePath: string, config: RenderConfig) {
  return new URL(
    routePathToPublicPath(routePath, config.trailingSlash),
    config.siteUrl
  ).href
}
