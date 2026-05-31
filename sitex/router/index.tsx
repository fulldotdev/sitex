import { renderToStaticMarkup } from "react-dom/server"

import type { Route } from "./routes.ts"

export type RenderRouteHtmlOptions = {
  assetTags?: string
  islandClientSrc?: string
}

export async function renderRouteHtml(
  route: Route,
  options: RenderRouteHtmlOptions = {}
) {
  let html = `<!doctype html>${renderToStaticMarkup(await route.layout())}`

  html = injectAssets(html, options)

  return html
}

function injectAssets(html: string, options: RenderRouteHtmlOptions) {
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

    result = result.replace("</body>", `${script}</body>`)
  }

  return result
}
