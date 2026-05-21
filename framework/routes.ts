import fg from "fast-glob"

import type { DefinedPages, PageEntry, PageLayout } from "./pages"

export type Route = {
  file: string
  path: string
  entry: PageEntry
  layout: PageLayout
}

type LoadModule = (id: string) => Promise<unknown>

export async function getRoutes(loadModule: LoadModule): Promise<Route[]> {
  const files = await fg("src/pages/**/*.tsx", {
    ignore: ["src/pages/examples/**"],
    onlyFiles: true,
  })
  const routes: Route[] = []

  for (const file of files) {
    const module = await loadModule(`/${file}`)
    const params = getRouteParams(file)

    if (params.length === 0) {
      routes.push(readStaticRoute(module, file))
      continue
    }

    const pages = readDefinedPages(module, file)

    for (const entry of pages.entries) {
      const parsedEntry = parseEntry(file, params, pages, entry)

      routes.push({
        file,
        path: pageFileToPath(file, parsedEntry),
        entry: parsedEntry,
        layout: pages.layout,
      })
    }
  }

  return routes
}

export function findRoute(routes: Route[], url: string) {
  const normalizedUrl = normalizePath(url)
  return routes.find((route) => normalizePath(route.path) === normalizedUrl)
}

function readStaticRoute(module: unknown, file: string): Route {
  const pageModule = module as { default?: unknown; meta?: unknown }
  const component = pageModule.default

  if (isDefinedPages(component)) {
    throw new Error(
      `Static page module "${file}" should default export a component directly, not definePages(...).`
    )
  }

  if (typeof component !== "function") {
    throw new Error(`Static page module "${file}" must default export a component.`)
  }

  return {
    file,
    path: staticPageFileToPath(file),
    entry: readStaticMeta(pageModule.meta),
    layout: component as PageLayout,
  }
}

function readStaticMeta(meta: unknown): PageEntry {
  if (!meta) return {}

  if (typeof meta !== "object" || Array.isArray(meta)) {
    throw new Error("Static page meta must be an object.")
  }

  return meta as PageEntry
}

function readDefinedPages(module: unknown, file: string): DefinedPages {
  const pages = (module as { default?: unknown }).default

  if (!isDefinedPages(pages)) {
    throw new Error(
      `Dynamic page module "${file}" must default export definePages(...).`
    )
  }

  const definition = pages as Partial<DefinedPages>

  if (!Array.isArray(definition.entries)) {
    throw new Error(`Page module "${file}" must define an entries array.`)
  }

  if (typeof definition.layout !== "function") {
    throw new Error(`Page module "${file}" must define a layout function.`)
  }

  return definition as DefinedPages
}

function isDefinedPages(value: unknown): value is DefinedPages {
  return Boolean(
    value &&
      typeof value === "object" &&
      Array.isArray((value as Partial<DefinedPages>).entries) &&
      typeof (value as Partial<DefinedPages>).layout === "function"
  )
}

function parseEntry(
  file: string,
  params: string[],
  pages: DefinedPages,
  entry: PageEntry
) {
  const schemaResult = pages.schema?.safeParse(entry)

  if (schemaResult && !schemaResult.success) {
    throw new Error(
      `Entry in "${file}" does not match its schema:\n${schemaResult.error.message}`
    )
  }

  const parsedEntry = schemaResult?.data ?? entry

  for (const param of params) {
    const value = parsedEntry[param]

    if (typeof value !== "string" || value.length === 0) {
      throw new Error(
        `Entry in "${file}" must include a non-empty string "${param}" route param.`
      )
    }
  }

  return parsedEntry
}

function staticPageFileToPath(file: string) {
  const route = file
    .replace(/^src\/pages/, "")
    .replace(/\/index\.tsx$/, "/")
    .replace(/\.tsx$/, "")

  return normalizePath(route || "/")
}

function pageFileToPath(file: string, entry: PageEntry) {
  const route = file
    .replace(/^src\/pages/, "")
    .replace(/\/index\.tsx$/, "/")
    .replace(/\.tsx$/, "")
    .replace(/\[(\.{3})?([^\]]+)\]/g, (_match, rest: string | undefined, name: string) => {
      const value = String(entry[name])
      return rest ? value.replace(/^\/+|\/+$/g, "") : value
    })

  return normalizePath(route || "/")
}

function getRouteParams(file: string) {
  return Array.from(file.matchAll(/\[(?:\.{3})?([^\]]+)\]/g), (match) => match[1])
}

function normalizePath(path: string) {
  if (!path || path === "/") return "/"
  return `/${path.replace(/^\/+|\/+$/g, "")}`
}
