import { renderToStaticMarkup } from "react-dom/server"

import type { Route } from "./routes"

export type RenderAssets = {
  scripts?: string[]
  styles: string[]
}

export async function renderRoute(route: Route, options: { assets: RenderAssets }) {
  const body = renderToStaticMarkup(await route.layout(route.entry))
  const title =
    typeof route.entry.title === "string" ? route.entry.title : "Ostra"
  const description =
    typeof route.entry.description === "string" ? route.entry.description : ""
  const locale =
    typeof route.entry.locale === "string" ? route.entry.locale : "en"

  return renderDocument({
    body,
    description,
    locale,
    scripts: options.assets.scripts ?? [],
    styles: options.assets.styles,
    title,
  })
}

function renderDocument({
  body,
  description,
  locale,
  scripts,
  styles,
  title,
}: {
  body: string
  description: string
  locale: string
  scripts: string[]
  styles: string[]
  title: string
}) {
  return `<!doctype html>
<html lang="${escapeHtml(locale)}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
${styles.map((href) => `    <link rel="stylesheet" href="${escapeHtml(href)}" />`).join("\n")}
  </head>
  <body>
    <div id="ostra-app">${body}</div>
${scripts.map((src) => `    <script type="module" src="${escapeHtml(src)}"></script>`).join("\n")}
  </body>
</html>`
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}
