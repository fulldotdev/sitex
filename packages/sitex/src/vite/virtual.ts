import type { EnvironmentModuleGraph, EnvironmentModuleNode } from "vite-plus"

import { resolvedVirtualHydrationId } from "../hydration/registry.ts"
import type { ResolvedSitexOptions } from "./options.ts"
import { packageFile } from "./paths.ts"

export const virtualRoutesId = "virtual:sitex-routes"

export const resolvedVirtualRoutesId = `\0${virtualRoutesId}`

export const virtualPagesId = "sitex:pages"

export const resolvedVirtualPagesId = `\0${virtualPagesId}`

export const virtualGlobalsId = "sitex:globals"

export const resolvedVirtualGlobalsId = `\0${virtualGlobalsId}`

export function createJavaScriptModule(code: string) {
  return {
    code,
    moduleType: "js",
  }
}

export function createVirtualRoutesCode() {
  return [
    `import { readPageRoute, sortRoutes, validateUniqueRoutePaths } from ${JSON.stringify(packageFile("router/runtime", "ts"))}`,
    `const routeModules = import.meta.glob(["/src/pages/**/*.mdx"])`,
    `export async function getRoutes() {`,
    `  const routes = []`,
    `  for (const [file, load] of Object.entries(routeModules)) {`,
    `    const routeFile = file.replace(/^\\/+/, "")`,
    `    routes.push(readPageRoute(await load(), routeFile))`,
    `  }`,
    `  validateUniqueRoutePaths(routes)`,
    `  return sortRoutes(routes)`,
    `}`,
  ].join("\n")
}

export function createPagesModuleCode(options: ResolvedSitexOptions) {
  const trailingSlash = JSON.stringify(options.trailingSlash)

  return [
    `import { normalizeRoutePath, pageFileToRoutePath, routePathToPublicPath } from ${JSON.stringify(packageFile("router/runtime", "ts"))}`,
    `const pageDataModules = import.meta.glob(["/src/pages/**/*.mdx"], { import: "data" })`,
    `const routeMeta = Object.keys(pageDataModules)`,
    `  .map((file) => {`,
    `    const routeFile = file.replace(/^\\/+/, "")`,
    `    const routePath = pageFileToRoutePath(routeFile)`,
    `    return { file: routeFile, routePath, path: routePathToPublicPath(routePath, ${trailingSlash}) }`,
    `  })`,
    `async function toPage(route) {`,
    `  const load = pageDataModules["/" + route.file]`,
    `  if (!load) return undefined`,
    `  const data = await load()`,
    `  if (data === undefined) return undefined`,
    `  return { path: route.path, ...data }`,
    `}`,
    `export async function getPages(prefix) {`,
    `  const routePrefix = prefix === undefined ? undefined : normalizeRoutePath(prefix)`,
    `  const matches = routePrefix === undefined || routePrefix === "/"`,
    `    ? routeMeta`,
    `    : routeMeta.filter((page) => page.routePath === routePrefix || page.routePath.startsWith(routePrefix + "/"))`,
    `  const pages = await Promise.all(matches.map(toPage))`,
    `  return pages.filter((page) => page !== undefined)`,
    `}`,
    `export async function getPage(path) {`,
    `  const routePath = normalizeRoutePath(path)`,
    `  const route = routeMeta.find((page) => page.routePath === routePath)`,
    `  return route ? toPage(route) : undefined`,
    `}`,
  ].join("\n")
}

export function invalidateVirtualModules(
  moduleGraph: EnvironmentModuleGraph,
  timestamp: number
) {
  const invalidatedModules = new Set<EnvironmentModuleNode>()

  for (const id of [
    resolvedVirtualHydrationId,
    resolvedVirtualRoutesId,
    resolvedVirtualPagesId,
    resolvedVirtualGlobalsId,
  ]) {
    const module = moduleGraph.getModuleById(id)

    if (module) {
      moduleGraph.invalidateModule(module, invalidatedModules, timestamp, true)
    }
  }
}

export function invalidateMdxPageModules(
  moduleGraph: EnvironmentModuleGraph,
  timestamp: number
) {
  const invalidatedModules = new Set<EnvironmentModuleNode>()

  for (const module of moduleGraph.idToModuleMap.values()) {
    if (module.file?.endsWith(".mdx")) {
      moduleGraph.invalidateModule(module, invalidatedModules, timestamp, true)
    }
  }
}
