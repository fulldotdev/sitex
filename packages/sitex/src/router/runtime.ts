import type { ReactNode } from "react"
import type { Graph, Thing, WithContext } from "schema-dts"

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

export type PageType = "webpage" | "article" | "faq"
export type JsonLd = Graph | WithContext<Thing>

export type FaqQuestion = {
  question: string
  answer: string
}

export type MarkdownHeading = {
  depth: number
  href: string
  id: string
  label: string
}

export type PageData = {
  layout: string
  title: string
  description: string
  type?: PageType
  image?: string
  canonical?: string
  noindex?: boolean
  publishedAt?: string
  updatedAt?: string
  author?: string
  questions?: FaqQuestion[]
  jsonLd?: JsonValue
  headings: MarkdownHeading[]
  [key: string]: JsonValue | undefined
}

export type LayoutProps<TData extends object = object> = TData & {
  title: string
  description: string
  type?: PageType
  image?: string
  canonical?: string
  noindex?: boolean
  publishedAt?: string
  updatedAt?: string
  author?: string
  questions?: readonly FaqQuestion[]
  jsonLd?: JsonLd | readonly JsonLd[]
  path: string
  url: string
  locale: string
  headings: readonly MarkdownHeading[]
  children: ReactNode
}

export type Route = {
  file: string
  path: string
  data: PageData
  component: () => ReactNode | Promise<ReactNode>
}

type PageModule = {
  default?: unknown
  data?: unknown
  render?: unknown
}

export function readPageRoute(module: unknown, file: string): Route {
  const pageModule = module as PageModule
  const component = pageModule.default

  if (typeof component !== "function") {
    throw new Error(`Page module "${file}" must default export a component.`)
  }

  if (pageModule.render !== undefined) {
    throw new Error(
      `Page "${file}" exports render, but Sitex pages are static. Remove the render export.`
    )
  }

  const data = pageModule.data

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`Page module "${file}" must export page data.`)
  }

  return {
    file,
    path: pageFileToRoutePath(file),
    data: data as PageData,
    component: component as Route["component"],
  }
}

export function sortRoutes(routes: Route[]) {
  return [...routes].sort((a, b) => a.path.localeCompare(b.path))
}

export function matchRoute(routes: Route[], url: string): Route | undefined {
  const path = normalizeRoutePath(safeDecodeUrl(url))

  return routes.find((route) => route.path === path)
}

function safeDecodeUrl(url: string) {
  try {
    return decodeURI(url)
  } catch {
    return url
  }
}

export function validateUniqueRoutePaths(routes: Route[]) {
  const seen = new Map<string, string>()

  for (const route of routes) {
    const previous = seen.get(route.path)

    if (previous) {
      throw new Error(
        `Routes "${previous}" and "${route.file}" both resolve to "${route.path}".`
      )
    }

    seen.set(route.path, route.file)
  }
}

export function pageFileToRoutePath(file: string) {
  if (/\[[^\]]*\]/.test(file)) {
    throw new Error(
      `Page "${file}" uses a dynamic segment. Sitex routes are static MDX files.`
    )
  }

  const route = file
    .replace(/^src\/pages/, "")
    .replace(/\/index\.mdx$/, "/")
    .replace(/\.mdx$/, "")

  return normalizeRoutePath(route || "/")
}

export function normalizeRoutePath(path: string) {
  if (!path || path === "/") return "/"
  return `/${path.replace(/^\/+|\/+$/g, "")}`
}

export function resolveRouteLocale(
  routePath: string,
  locales: readonly string[],
  defaultLocale: string
) {
  const segment = routePath.split("/").find(Boolean)

  return segment && locales.includes(segment) ? segment : defaultLocale
}

export function routePathToPublicPath(path: string, trailingSlash: boolean) {
  if (path === "/") return "/"

  return trailingSlash ? `${path.replace(/\/$/, "")}/` : path.replace(/\/$/, "")
}
