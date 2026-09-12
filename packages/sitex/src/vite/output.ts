import type { Manifest } from "vite-plus"

import { access, mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { pathToFileURL } from "node:url"

import { escapeHtmlAttribute as escapeXml } from "../render/html.ts"
import { routePathToPublicPath, type Route } from "../router/runtime.ts"
import {
  createCssAssetMap,
  readManifestChunkCss,
  readRouteStylesheetAssets,
} from "./css.ts"
import { readGlobalsNameSync } from "./globals.ts"
import { createRenderConfig, type ResolvedSitexOptions } from "./options.ts"
import { publicAssetPath, ssrBuildDir } from "./paths.ts"

type RenderModule = typeof import("../render/render.tsx")

export type BuildOutputChunk = {
  facadeModuleId: string | null
  fileName: string
  imports: string[]
  moduleIds: string[]
  type: "chunk"
}

export function collectOutputChunks(result: unknown): BuildOutputChunk[] {
  const outputs = Array.isArray(result) ? result : [result]
  const chunks: BuildOutputChunk[] = []

  for (const output of outputs) {
    if (!output || typeof output !== "object" || !("output" in output)) {
      continue
    }

    for (const entry of (output as { output: unknown[] }).output) {
      if (
        entry &&
        typeof entry === "object" &&
        "type" in entry &&
        entry.type === "chunk"
      ) {
        chunks.push(entry as BuildOutputChunk)
      }
    }
  }

  return chunks
}

export async function writeStaticHtml(
  root: string,
  options: ResolvedSitexOptions,
  ssrChunks: BuildOutputChunk[]
) {
  const publicRoot = await findBuildPublicRoot(root)
  const manifest = await readManifest(publicRoot)
  const islandClientAsset = Object.values(manifest).find(
    (entry) => entry.name === "islandClient"
  )
  const prefetchClientAsset = Object.values(manifest).find(
    (entry) => entry.name === "prefetchClient"
  )
  const cssAssetMap = createCssAssetMap(root, manifest)
  const renderFile = path.join(root, ssrBuildDir, "render.mjs")
  const render = (await import(pathToFileURL(renderFile).href)) as RenderModule
  const routes = await render.getRoutes()

  for (const route of routes) {
    const html = await render.renderRoute(
      route,
      createRenderConfig(options),
      ({ hasIslands }) => {
        const stylesheetHrefs = readRouteStylesheetAssets(
          ssrChunks,
          root,
          route.file,
          cssAssetMap
        )

        if (hasIslands) {
          stylesheetHrefs.push(...readManifestChunkCss(islandClientAsset))
        }

        return {
          islandClientSrc:
            hasIslands && islandClientAsset?.file
              ? publicAssetPath(islandClientAsset.file)
              : undefined,
          prefetchClientSrc: prefetchClientAsset?.file
            ? publicAssetPath(prefetchClientAsset.file)
            : undefined,
          stylesheetHrefs,
        }
      }
    )

    await writeHtml(publicRoot, route.path, html, options)
  }

  await writeGeneratedFavicon(publicRoot, root, options)
  await writeSitemap(publicRoot, routes, options)
  await writeRobots(publicRoot, options)
}

async function writeHtml(
  publicRoot: string,
  routePath: string,
  html: string,
  options: ResolvedSitexOptions
) {
  const file = routePathToHtmlFile(publicRoot, routePath, options.trailingSlash)

  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, html)
}

async function writeGeneratedFavicon(
  publicRoot: string,
  root: string,
  options: ResolvedSitexOptions
) {
  const favicon = createGeneratedFavicon(root, options)

  if (!favicon) return

  const file = path.join(publicRoot, "favicon.svg")

  try {
    await access(file)
    return
  } catch {
    // No app-provided favicon was copied to dist; write the generated one.
  }

  await writeFile(file, favicon)
}

export async function hasPublicFile(root: string, file: string) {
  try {
    await access(path.join(root, "public", file))
    return true
  } catch {
    return false
  }
}

export function createGeneratedFavicon(
  root: string,
  options: ResolvedSitexOptions
) {
  if (options.favicon === false) return

  const label =
    options.favicon.text ??
    readGlobalsNameSync(root, options) ??
    new URL(options.site.url).hostname
  const text = createFaviconText(label)

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">`,
    `  <rect width="64" height="64" rx="14" fill="${escapeXml(options.favicon.background)}"/>`,
    `  <text x="50%" y="50%" dy=".35em" text-anchor="middle" fill="${escapeXml(options.favicon.color)}" font-family="Arial, sans-serif" font-size="${text.length > 1 ? 28 : 34}" font-weight="700">${escapeXml(text)}</text>`,
    `</svg>`,
    "",
  ].join("\n")
}

function createFaviconText(label: string) {
  const words = label
    .replace(/https?:\/\//, "")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)

  const initials =
    words.length >= 2
      ? `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}`
      : (words[0]?.slice(0, 2) ?? "S")

  return initials.toUpperCase()
}

async function writeSitemap(
  publicRoot: string,
  routes: Route[],
  options: ResolvedSitexOptions
) {
  const file = path.join(publicRoot, "sitemap.xml")

  try {
    await access(file)
    return
  } catch {
    // No app-provided sitemap.xml; write the generated one.
  }

  const entries = routes
    .filter((route) => {
      if (route.data.noindex === true) return false

      const publicPath = routePathToPublicPath(
        route.path,
        options.trailingSlash
      )

      // A canonical override means this URL is not the page's canonical
      // location, so it does not belong in the sitemap.
      return (
        route.data.canonical === undefined ||
        route.data.canonical === `${options.site.url}${publicPath}`
      )
    })
    .map((route) => {
      const publicPath = routePathToPublicPath(
        route.path,
        options.trailingSlash
      )
      const loc = `${options.site.url}${publicPath}`
      const lastmod = route.data.updatedAt ?? route.data.publishedAt
      const lines = [`    <loc>${escapeXml(loc)}</loc>`]

      if (lastmod) lines.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`)

      return ["  <url>", ...lines, "  </url>"].join("\n")
    })

  const sitemap = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...entries,
    `</urlset>`,
    "",
  ].join("\n")

  await writeFile(file, sitemap)
}

async function writeRobots(publicRoot: string, options: ResolvedSitexOptions) {
  const file = path.join(publicRoot, "robots.txt")

  try {
    await access(file)
    return
  } catch {
    // No app-provided robots.txt; write the default.
  }

  const robots = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${options.site.url}/sitemap.xml`,
    "",
  ].join("\n")

  await writeFile(file, robots)
}

export function routePathToHtmlFile(
  root: string,
  routePath: string,
  trailingSlash: boolean
) {
  const normalizedRoutePath = routePath.replace(/^\/+|\/+$/g, "")

  if (routePath === "/" || normalizedRoutePath === "") {
    return path.join(root, "index.html")
  }

  return trailingSlash
    ? path.join(root, normalizedRoutePath, "index.html")
    : path.join(root, `${normalizedRoutePath}.html`)
}

async function findBuildPublicRoot(root: string) {
  const publicRoot = path.join(root, "dist")

  await mkdir(publicRoot, { recursive: true })

  return publicRoot
}

async function readManifest(publicRoot: string): Promise<Manifest> {
  const file = path.join(publicRoot, ".vite/manifest.json")
  try {
    return JSON.parse(await readFile(file, "utf8")) as Manifest
  } catch {
    return {}
  }
}
