import { renderToStaticMarkup, renderToString } from "react-dom/server"
import type { ReactNode } from "react"

import type { Route } from "./routes"
import { readGlobalForLocale, readPage } from "./content"
import { layouts } from "./layouts"
import { getPageOptions } from "./page-options"
import { shell, shellOptions } from "./shell"
import { PageSlot } from "./page-slot"

export type RenderAssets = {
  appScripts: string[]
  pageScripts: string[]
  shellScripts: string[]
  styles: string[]
}

export type PageRenderProps = {
  page: Awaited<ReturnType<typeof readPage>>["data"]
  global: Awaited<ReturnType<typeof readGlobalForLocale>>
  content: string
  locale: string
  route: {
    file: string
    path: string
  }
  render: {
    at: string
    output: "static" | "server" | "none"
    client: "load" | "none"
  }
}

export type ShellRenderProps = Omit<PageRenderProps, "content"> & {
  pageHtml: string
}

export type AppRenderProps = {
  page: PageRenderProps
  shell: ShellRenderProps
}

export async function renderRoute(
  route: Route,
  options: { assets: RenderAssets }
) {
  const page = await readPage(route.file)
  const global = await readGlobalForLocale(route.locale)
  const pageOptions = getPageOptions(page.data.type)
  const Layout = layouts[page.data.type] as (props: {
    page: typeof page.data
    global: typeof global
    content: string
    locale: string
    route: {
      file: string
      path: string
    }
    render: {
      at: string
      output: "static" | "server" | "none"
      client: "load" | "none"
    }
  }) => ReactNode

  if (!Layout) {
    throw new Error(`No layout registered for page type "${page.data.type}".`)
  }

  const props: PageRenderProps = {
    page: page.data,
    global,
    content: page.html,
    locale: route.locale,
    route: {
      file: route.file,
      path: route.path,
    },
    render: {
      at: new Date().toISOString(),
      output: pageOptions.output,
      client: pageOptions.client,
    },
  }

  const pageLayout = <Layout {...props} />
  const pageHtml =
    pageOptions.output === "none"
      ? ""
      : pageOptions.client === "load"
        ? renderToString(pageLayout)
        : renderToStaticMarkup(pageLayout)
  const Shell = shell as (props: ShellRenderProps & { children: ReactNode }) => ReactNode
  const shellProps: ShellRenderProps = {
    page: props.page,
    global: props.global,
    locale: props.locale,
    route: props.route,
    render: props.render,
    pageHtml,
  }
  const shellClient = shellOptions.client === "load"
  const pageClient = pageOptions.client === "load"
  const appClient = shellClient && pageClient && pageOptions.output !== "none"
  const shellLayout = (
    <Shell {...shellProps}>
      <PageSlot html={pageHtml} />
    </Shell>
  )
  const body =
    shellClient || appClient
      ? renderToString(shellLayout)
      : renderToStaticMarkup(shellLayout)

  return [
    "<!doctype html>",
    `<html lang="${global.locale}">`,
    "<head>",
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${escapeHtml(page.data.seo.title)}</title>`,
    `<meta name="description" content="${escapeHtml(page.data.seo.description)}" />`,
    ...options.assets.styles.map((href) => `<link rel="stylesheet" href="${href}" />`),
    "</head>",
    `<body><div id="ostra-app">${body}</div>`,
    ...(appClient
      ? [
          `<script id="ostra-app-data" type="application/json">${serializeJson({
            page: props,
            shell: shellProps,
          } satisfies AppRenderProps)}</script>`,
          ...options.assets.appScripts.map(
            (src) => `<script type="module" src="${src}"></script>`
          ),
        ]
      : []),
    ...(shellClient && !appClient
      ? [
          `<script id="ostra-shell-data" type="application/json">${serializeJson(
            shellProps
          )}</script>`,
          ...options.assets.shellScripts.map(
            (src) => `<script type="module" src="${src}"></script>`
          ),
        ]
      : []),
    ...(pageClient && !appClient
      ? [
          `<script id="ostra-page-data" type="application/json">${serializeJson(
            props
          )}</script>`,
          ...options.assets.pageScripts.map(
            (src) => `<script type="module" src="${src}"></script>`
          ),
        ]
      : []),
    "</body>",
    "</html>",
  ].join("")
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;")
}

function serializeJson(value: unknown) {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (character) => {
    switch (character) {
      case "<":
        return "\\u003c"
      case ">":
        return "\\u003e"
      case "&":
        return "\\u0026"
      case "\u2028":
        return "\\u2028"
      case "\u2029":
        return "\\u2029"
      default:
        return character
    }
  })
}
