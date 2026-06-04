import type { ReactNode } from "react"

export type PageLayout = () => ReactNode | Promise<ReactNode>
export type Route = {
  file: string
  path: string
  layout: PageLayout
}

export function findRoute(routes: Route[], url: string) {
  const normalizedUrl = normalizePath(url)
  return routes.find((route) => normalizePath(route.path) === normalizedUrl)
}

export function readStaticRoute(module: unknown, file: string): Route {
  const pageModule = module as { default?: unknown }
  const component = pageModule.default

  if (hasRouteParams(file)) {
    throw new Error(
      `Dynamic page module "${file}" is not supported. Add explicit TSX files for each route instead.`
    )
  }

  if (typeof component !== "function") {
    throw new Error(
      `Static page module "${file}" must default export a component.`
    )
  }

  return {
    file,
    path: staticPageFileToPath(file),
    layout: component as PageLayout,
  }
}

function staticPageFileToPath(file: string) {
  const route = file
    .replace(/^src\/pages/, "")
    .replace(/\/index\.tsx$/, "/")
    .replace(/\.tsx$/, "")

  return normalizePath(route || "/")
}

function hasRouteParams(file: string) {
  return /\[[^\]]+\]/.test(file)
}

function normalizePath(path: string) {
  if (!path || path === "/") return "/"
  return `/${path.replace(/^\/+|\/+$/g, "")}`
}
