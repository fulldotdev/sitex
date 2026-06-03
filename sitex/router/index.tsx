import { prerender } from "react-dom/static"

import type { Route } from "./routes.ts"

export type RenderRouteHtmlOptions = {
  assetTags?: string
  islandClientSrc?: string
}

export async function renderRouteHtml(
  route: Route,
  options: RenderRouteHtmlOptions = {}
) {
  const { prelude } = await prerender(await route.layout())
  let html = `<!doctype html>${await new Response(prelude).text()}`

  html = injectRouteHtmlAssets(html, options)

  return html
}

export function injectRouteHtmlAssets(
  html: string,
  options: RenderRouteHtmlOptions
) {
  const script =
    options.islandClientSrc && html.includes("data-sitex-island")
      ? `<script src="${options.islandClientSrc}" type="module"></script>`
      : ""
  const headTags = options.assetTags ?? ""
  let result = html

  if (headTags) {
    if (!result.includes("</head>")) {
      throw new Error(
        "Sitex could not inject build assets because the document shell has no </head>."
      )
    }

    result = result.replace("</head>", `${headTags}</head>`)
  }

  if (script) {
    if (!result.includes("</body>")) {
      throw new Error(
        "Sitex could not inject island client assets because the document shell has no </body>."
      )
    }

    result = replaceLast(result, "</body>", `${script}</body>`)
  }

  return result
}

function replaceLast(value: string, search: string, replacement: string) {
  const index = value.lastIndexOf(search)

  if (index === -1) return value

  return `${value.slice(0, index)}${replacement}${value.slice(index + search.length)}`
}
