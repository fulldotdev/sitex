import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import type {
  Connect,
  Manifest,
  Plugin,
  PluginOption,
  PreviewServer,
  ResolvedConfig,
  UserConfig,
  ViteDevServer,
} from "vite"
import { createServer } from "vite"
import fg from "fast-glob"
import tsconfigPaths from "vite-tsconfig-paths"

import {
  collectHydrationEntries,
  transformClientDirectives,
} from "../hydration/compiler.ts"
import {
  createVirtualHydrationCode,
  resolvedVirtualHydrationId,
  virtualHydrationId,
  type HydrationRegistry,
} from "../hydration/registry.ts"
import { findRoute, getRoutes } from "../router/routes.ts"

const packageRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const islandClientInput = normalizePath(packageFile("hydration/client.tsx"))

const isHtmlRequest = (req: Connect.IncomingMessage) => {
  if (!req.url || (req.method !== "GET" && req.method !== "HEAD")) return false
  if (req.url.includes(".")) return false

  const accept = req.headers.accept ?? ""
  return accept.includes("text/html") || accept.includes("*/*")
}

export function sitex(): PluginOption[] {
  return [tsconfigPaths(), sitexPlugin()]
}

function sitexPlugin(): Plugin {
  let root = process.cwd()
  let config: ResolvedConfig
  const hydration: HydrationRegistry = new Map()
  let cssInputs: string[] = []

  return {
    name: "sitex",
    enforce: "pre",

    async config(): Promise<UserConfig> {
      cssInputs = await collectCssInputs(process.cwd())

      return {
        build: {
          assetsDir: "assets",
          manifest: true,
          outDir: "dist",
          emptyOutDir: false,
          rollupOptions: {
            input: {
              islandClient: islandClientInput,
              ...Object.fromEntries(
                cssInputs.map((input, index) => [`style${index}`, input])
              ),
            },
          },
        },
      }
    },

    configResolved(resolvedConfig) {
      config = resolvedConfig
      root = resolvedConfig.root
    },

    async buildStart() {
      hydration.clear()
      cssInputs = await collectCssInputs(root)

      if (config.command === "build") {
        await rm(path.join(root, "dist"), { recursive: true, force: true })
      }

      const files = await fg("src/**/*.tsx", {
        cwd: root,
        ignore: ["src/pages/examples/**"],
        onlyFiles: true,
      })

      for (const file of files) {
        const absoluteFile = path.join(root, file)
        const code = await readFile(absoluteFile, "utf8")
        collectHydrationEntries(code, absoluteFile, root, hydration)
      }
    },

    resolveId(id) {
      if (id === virtualHydrationId) return resolvedVirtualHydrationId
    },

    async load(id) {
      if (id !== resolvedVirtualHydrationId) return

      return createVirtualHydrationCode(hydration.values())
    },

    transform(code, id) {
      if (!id.endsWith(".tsx") || !code.includes("client:")) return

      return transformClientDirectives(code, id, root, hydration)
    },

    configureServer(server: ViteDevServer) {
      return () => {
        server.middlewares.use(async (req, res, next) => {
          if (!isHtmlRequest(req)) {
            next()
            return
          }

          const url = req.url?.split("?")[0] ?? "/"
          const routes = await getRoutes((id) => server.ssrLoadModule(id))
          const route = findRoute(routes, url)

          if (!route) {
            next()
            return
          }

          try {
            const mod = await server.ssrLoadModule(
              packageFile("router/index.tsx")
            )
            const html = await mod.renderRouteHtml(route, {
              assetTags: renderStylesheetTags(cssInputs),
              islandClientSrc: devServerFileUrl("hydration/client.tsx"),
            })
            const transformed = await server.transformIndexHtml(url, html)

            res.statusCode = 200
            res.setHeader("Content-Type", "text/html")
            res.end(req.method === "HEAD" ? undefined : transformed)
          } catch (error) {
            server.ssrFixStacktrace(error as Error)
            next(error)
          }
        })
      }
    },

    configurePreviewServer(server: PreviewServer) {
      return () => {
        server.middlewares.use(async (req, res, next) => {
          if (!isHtmlRequest(req)) {
            next()
            return
          }

          const url = req.url?.split("?")[0] ?? "/"
          const file = routePathToHtmlFile(root, url)

          try {
            const html = await readFile(file, "utf8")

            res.statusCode = 200
            res.setHeader("Content-Type", "text/html")
            res.end(req.method === "HEAD" ? undefined : html)
          } catch {
            next()
          }
        })
      }
    },

    async handleHotUpdate(ctx) {
      if (
        ctx.file.includes("/src/pages/") ||
        ctx.file.includes("/src/components/layouts/") ||
        ctx.file.includes("/src/data/")
      ) {
        ctx.server.ws.send({ type: "full-reload" })
        return []
      }
    },

    async writeBundle() {
      if (config.command !== "build") return

      await writeStaticHtml(root, cssInputs)
    },
  }
}

async function writeStaticHtml(root: string, cssInputs: string[]) {
  const manifest = await readManifest(root)
  const islandClientAsset = Object.values(manifest).find(
    (entry) => entry.name === "islandClient"
  )
  const stylesheetTags = renderStylesheetTags(
    readStylesheetAssets(root, manifest, cssInputs)
  )

  const server = await createServer({
    configFile: path.join(root, "vite.config.ts"),
    server: { middlewareMode: true },
    appType: "custom",
    mode: "production",
  })

  try {
    const { getRoutes } = await server.ssrLoadModule(
      packageFile("router/routes.ts")
    )
    const { renderRouteHtml } = await server.ssrLoadModule(
      packageFile("router/index.tsx")
    )
    const routes = await getRoutes((id: string) => server.ssrLoadModule(id))

    for (const route of routes) {
      const html = await renderRouteHtml(route, {
        assetTags: stylesheetTags,
        islandClientSrc: islandClientAsset?.file
          ? publicAssetPath(islandClientAsset.file)
          : undefined,
      })

      await writeHtml(root, route.path, html)
    }
  } finally {
    await server.close()
  }
}

async function writeHtml(root: string, routePath: string, html: string) {
  const file = routePathToHtmlFile(root, routePath)

  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, html)
}

function routePathToHtmlFile(root: string, routePath: string) {
  const normalizedRoutePath = routePath.replace(/^\/+|\/+$/g, "")

  return routePath === "/"
    ? path.join(root, "dist/index.html")
    : path.join(root, "dist", normalizedRoutePath, "index.html")
}

async function readManifest(root: string): Promise<Manifest> {
  const file = path.join(root, "dist/.vite/manifest.json")
  return JSON.parse(await readFile(file, "utf8")) as Manifest
}

function readStylesheetAssets(
  root: string,
  manifest: Manifest,
  cssInputs: string[]
) {
  const assets = new Set<string>()

  for (const input of cssInputs) {
    const manifestKey = normalizePath(path.relative(root, input))
    const entry = manifest[manifestKey] ?? manifest[input]

    if (entry?.file?.endsWith(".css")) assets.add(publicAssetPath(entry.file))

    for (const cssFile of entry?.css ?? []) {
      assets.add(publicAssetPath(cssFile))
    }
  }

  return [...assets]
}

function renderStylesheetTags(hrefs: string[]) {
  return hrefs.map((href) => `<link href="${href}" rel="stylesheet">`).join("")
}

function publicAssetPath(file: string) {
  return `/${file.replace(/^\/+/, "")}`
}

async function collectCssInputs(root: string) {
  const files = await fg("src/**/*.{css,tsx,ts,jsx,js}", {
    cwd: root,
    onlyFiles: true,
  })
  const cssFiles = new Set<string>()

  for (const file of files) {
    if (file.endsWith(".css")) {
      cssFiles.add(path.join(root, file))
      continue
    }

    const absoluteFile = path.join(root, file)
    const code = await readFile(absoluteFile, "utf8")

    for (const source of readCssImportSources(code)) {
      cssFiles.add(resolveCssImport(root, absoluteFile, source))
    }
  }

  return [...cssFiles].map(normalizePath)
}

function readCssImportSources(code: string) {
  return [...code.matchAll(/\bimport\s+["']([^"']+\.css)["']/g)].map(
    (match) => match[1]
  )
}

function resolveCssImport(root: string, importer: string, source: string) {
  if (source.startsWith("@/")) {
    return path.join(root, "src", source.slice(2))
  }

  if (source.startsWith("/")) {
    return path.join(root, source)
  }

  return path.resolve(path.dirname(importer), source)
}

function packageFile(file: string) {
  return path.join(packageRoot, file)
}

function devServerFileUrl(file: string) {
  return `/@fs/${packageFile(file).replaceAll(path.sep, "/")}`
}

function normalizePath(file: string) {
  return file.replaceAll(path.sep, "/")
}
