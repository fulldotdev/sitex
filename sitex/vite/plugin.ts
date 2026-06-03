import { randomUUID } from "node:crypto"
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import type {
  Connect,
  EnvironmentModuleGraph,
  EnvironmentModuleNode,
  Manifest,
  Plugin,
  PluginOption,
  PreviewServer,
  ResolvedConfig,
  UserConfig,
  ViteDevServer,
} from "vite"
import { createServer, isRunnableDevEnvironment, normalizePath } from "vite"
import fg from "fast-glob"

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

const packageRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const packageSourceExtension = path.extname(fileURLToPath(import.meta.url))
const islandClientInput = normalizePath(packageFile("hydration/client", "tsx"))
const virtualRoutesId = "virtual:sitex-routes"
const resolvedVirtualRoutesId = `\0${virtualRoutesId}`
const virtualRenderId = "virtual:sitex-render"
const resolvedVirtualRenderId = `\0${virtualRenderId}`
const virtualContentId = "sitex:content"
const resolvedVirtualContentId = `\0${virtualContentId}`
const contentTypesFile = ".sitex/content.d.ts"

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

type ContentPage = {
  file: string
  path: string
  content: JsonValue
}

type ContentRoute = {
  file: string
  path: string
}

const isHtmlRequest = (req: Connect.IncomingMessage) => {
  if (!req.url || (req.method !== "GET" && req.method !== "HEAD")) return false
  if (req.url.includes(".")) return false

  const accept = req.headers.accept ?? ""
  return accept.includes("text/html") || accept.includes("*/*")
}

function shouldGenerateContentTypes() {
  return process.env.SITEX_CONTENT !== "0"
}

export function sitex(): PluginOption[] {
  return [sitexPlugin()]
}

function sitexPlugin(): Plugin {
  let root = process.cwd()
  let config: ResolvedConfig
  const hydration: HydrationRegistry = new Map()

  return {
    name: "sitex",
    enforce: "pre",

    config(userConfig): UserConfig {
      const configRoot = path.resolve(userConfig.root ?? process.cwd())

      return {
        resolve: {
          tsconfigPaths: true,
        },
        build: {
          assetsDir: "assets",
          manifest: true,
          outDir: "dist",
          emptyOutDir: false,
          rolldownOptions: {
            input: createBuildInput(configRoot),
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

    resolveId: {
      filter: {
        id: /^(virtual:sitex-islands|virtual:sitex-routes|virtual:sitex-render|sitex:content)$/,
      },
      handler(id) {
        if (id === virtualHydrationId) return resolvedVirtualHydrationId
        if (id === virtualRoutesId) return resolvedVirtualRoutesId
        if (id === virtualRenderId) return resolvedVirtualRenderId
        if (id === virtualContentId) return resolvedVirtualContentId
      },
    },

    load: {
      filter: {
        id: /^(\0virtual:sitex-islands|\0virtual:sitex-routes|\0virtual:sitex-render|\0sitex:content)$/,
      },
      async handler(id) {
        if (id === resolvedVirtualHydrationId) {
          return createJavaScriptModule(
            createVirtualHydrationCode(hydration.values())
          )
        }

        if (id === resolvedVirtualRoutesId) {
          return createJavaScriptModule(createVirtualRoutesCode())
        }

        if (id === resolvedVirtualRenderId) {
          return createJavaScriptModule(createVirtualRenderCode())
        }

        if (id === resolvedVirtualContentId) {
          return createJavaScriptModule(createContentModuleCode())
        }
      },
    },

    transform: {
      filter: {
        id: /\.tsx$/,
        code: "client:",
      },
      handler(code, id) {
        if (!id.endsWith(".tsx") || !code.includes("client:")) return

        return transformClientDirectives(code, id, root, hydration)
      },
    },

    configureServer(server: ViteDevServer) {
      if (shouldGenerateContentTypes()) {
        void writeContentTypesFromServer(root, server).catch(
          (error: unknown) => {
            server.config.logger.error(formatContentTypeError(error))
          }
        )
      }

      return () => {
        server.middlewares.use(async (req, res, next) => {
          if (!isHtmlRequest(req)) {
            next()
            return
          }

          const url = req.url?.split("?")[0] ?? "/"

          try {
            const { render } = await importServerModule(server, virtualRenderId)
            const initialHtml = await render(url, {
              islandClientSrc: devServerFileUrl("hydration/client", "tsx"),
            })

            if (!initialHtml) {
              next()
              return
            }

            const html = await render(url, {
              assetTags: renderStylesheetTags(readDevStylesheetHrefs(server)),
              islandClientSrc: devServerFileUrl("hydration/client", "tsx"),
            })

            if (!html) {
              next()
              return
            }

            const transformed = await server.transformIndexHtml(url, html)

            res.statusCode = 200
            res.setHeader("Content-Type", "text/html")
            res.end(req.method === "HEAD" ? undefined : transformed)
          } catch (error) {
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

    hotUpdate: {
      async handler(options) {
        const file = normalizePath(options.file)

        if (!shouldReloadForFile(file)) return

        invalidateVirtualModules(
          this.environment.moduleGraph,
          options.timestamp
        )

        if (
          shouldGenerateContentTypes() &&
          (file.includes("/src/pages/") || file.includes("/src/data/"))
        ) {
          await writeContentTypesFromServer(root, options.server)
        }

        this.environment.hot.send({ type: "full-reload" })
        return []
      },
    },

    async writeBundle() {
      if (config.command !== "build") return

      await writeStaticHtml(root)
    },
  }
}

function createJavaScriptModule(code: string) {
  return {
    code,
    moduleType: "js",
  }
}

function createBuildInput(root: string) {
  const input: Record<string, string> = {
    islandClient: islandClientInput,
  }

  for (const file of collectStyleFilesSync(root)) {
    const name = file.replace(/^src\//, "").replace(/\.css$/, "")

    input[name] = normalizePath(path.join(root, file))
  }

  return input
}

async function writeStaticHtml(root: string) {
  const manifest = await readManifest(root)
  const islandClientAsset = Object.values(manifest).find(
    (entry) => entry.name === "islandClient"
  )
  const stylesheetTags = renderStylesheetTags(readStylesheetAssets(manifest))

  const server = await createServer({
    configFile: path.join(root, "vite.config.ts"),
    server: { middlewareMode: true },
    appType: "custom",
    mode: "production",
  })

  try {
    if (shouldGenerateContentTypes()) {
      await writeContentTypesFromServer(root, server)
    }

    const { getRoutes, injectRouteHtmlAssets, render } =
      await importServerModule(server, virtualRenderId)
    const routes = await getRoutes()

    for (const route of routes) {
      const html = await render(route.path)

      if (!html) {
        throw new Error(`Sitex could not render route "${route.path}".`)
      }

      const transformed = stripViteClientScript(
        await server.transformIndexHtml(route.path, html)
      )
      const finalHtml = injectRouteHtmlAssets(transformed, {
        assetTags: stylesheetTags,
        islandClientSrc: islandClientAsset?.file
          ? publicAssetPath(islandClientAsset.file)
          : undefined,
      })

      await writeHtml(root, route.path, finalHtml)
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

async function collectRouteFiles(root: string) {
  return fg("src/pages/**/*.tsx", {
    cwd: root,
    ignore: ["src/pages/examples/**"],
    onlyFiles: true,
  })
}

function collectStyleFilesSync(root: string) {
  return fg.sync("src/**/*.css", {
    cwd: root,
    onlyFiles: true,
  })
}

async function collectContentRoutes(root: string) {
  const files = await collectRouteFiles(root)
  const routes: ContentRoute[] = []

  for (const file of files) {
    if (hasRouteParams(file)) continue

    const code = await readFile(path.join(root, file), "utf8")

    if (hasContentExport(code)) {
      routes.push({
        file,
        path: staticPageFileToPath(file),
      })
    }
  }

  return routes
}

async function collectContentPagesFromServer(
  root: string,
  server: ViteDevServer
) {
  const routes = await collectContentRoutes(root)
  const pages: ContentPage[] = []

  for (const route of routes) {
    const module = (await importServerModule(server, `/${route.file}`)) as {
      content?: unknown
    }

    if (module.content !== undefined) {
      pages.push({
        ...route,
        content: readJsonContent(module.content, route.file),
      })
    }
  }

  return pages
}

async function writeContentTypesFromServer(
  root: string,
  server: ViteDevServer
) {
  const typesFile = path.join(root, contentTypesFile)
  const pages = await collectContentPagesFromServer(root, server)

  await mkdir(path.dirname(typesFile), { recursive: true })
  await writeFileAtomic(typesFile, await createContentTypesCode(pages))
}

function formatContentTypeError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)

  return `[sitex] Could not generate content types: ${message}`
}

function shouldReloadForFile(file: string) {
  return (
    file.includes("/src/pages/") ||
    file.includes("/src/components/") ||
    file.includes("/src/data/")
  )
}

function invalidateVirtualModules(
  moduleGraph: EnvironmentModuleGraph,
  timestamp: number
) {
  const invalidatedModules = new Set<EnvironmentModuleNode>()

  for (const id of [
    resolvedVirtualRoutesId,
    resolvedVirtualRenderId,
    resolvedVirtualContentId,
  ]) {
    const module = moduleGraph.getModuleById(id)

    if (module) {
      moduleGraph.invalidateModule(module, invalidatedModules, timestamp, true)
    }
  }
}

async function importServerModule(server: ViteDevServer, id: string) {
  const environment = server.environments.ssr

  if (!isRunnableDevEnvironment(environment)) {
    throw new Error(
      `Sitex requires a runnable Vite server environment to import "${id}".`
    )
  }

  return environment.runner.import(id)
}

async function writeFileAtomic(file: string, content: string) {
  const temporaryFile = `${file}.${process.pid}.${randomUUID()}.tmp`

  await writeFile(temporaryFile, content)
  await rename(temporaryFile, file)
}

function createVirtualRoutesCode() {
  return [
    `import { readStaticRoute } from ${JSON.stringify(packageFile("router/routes", "ts"))}`,
    `const routeModules = import.meta.glob("/src/pages/**/*.tsx")`,
    `function isRouteFile(file) {`,
    `  return !file.includes("/src/pages/examples/") && !/\\[[^\\]]+\\]/.test(file)`,
    `}`,
    `export async function getRoutes() {`,
    `  const routes = []`,
    `  for (const [file, load] of Object.entries(routeModules)) {`,
    `    if (!isRouteFile(file)) continue`,
    `    const routeFile = file.replace(/^\\/+/, "")`,
    `    routes.push(readStaticRoute(await load(), routeFile))`,
    `  }`,
    `  return routes`,
    `}`,
  ].join("\n")
}

function createContentModuleCode() {
  return [
    `const contentModules = import.meta.glob("/src/pages/**/*.tsx", { import: "content" })`,
    `function normalizeRoutePath(path) {`,
    `  if (!path || path === "/") return "/"`,
    `  return "/" + path.replace(/^\\/+|\\/+$/g, "")`,
    `}`,
    `function staticPageFileToPath(file) {`,
    `  const route = file.replace(/^src\\/pages/, "").replace(/\\/index\\.tsx$/, "/").replace(/\\.tsx$/, "")`,
    `  return normalizeRoutePath(route || "/")`,
    `}`,
    `function isRouteFile(file) {`,
    `  return !file.includes("/src/pages/examples/") && !/\\[[^\\]]+\\]/.test(file)`,
    `}`,
    `const routeMeta = Object.keys(contentModules)`,
    `  .filter(isRouteFile)`,
    `  .map((file) => {`,
    `    const routeFile = file.replace(/^\\/+/, "")`,
    `    return { file: routeFile, path: staticPageFileToPath(routeFile) }`,
    `  })`,
    `async function toPage(route) {`,
    `  const load = contentModules["/" + route.file]`,
    `  if (!load) return undefined`,
    `  const content = await load()`,
    `  if (content === undefined) return undefined`,
    `  return { file: route.file, path: route.path, content }`,
    `}`,
    `export async function getPages(prefix) {`,
    `  const matches = prefix === undefined ? routeMeta : routeMeta.filter((page) => page.path.startsWith(prefix))`,
    `  const pages = await Promise.all(matches.map(toPage))`,
    `  return pages.filter((page) => page !== undefined)`,
    `}`,
    `export async function getPage(path) {`,
    `  const route = routeMeta.find((page) => page.path === path)`,
    `  return route ? toPage(route) : undefined`,
    `}`,
  ].join("\n")
}

async function createContentTypesCode(pages: ContentPage[]) {
  const { InputData, jsonInputForTargetLanguage, quicktype } =
    await import("quicktype-core")
  const jsonInput = jsonInputForTargetLanguage("typescript")

  await jsonInput.addSource({
    name: "Page",
    samples:
      pages.length > 0
        ? pages.map((page) => JSON.stringify(page))
        : [JSON.stringify({ file: "", path: "", content: {} })],
  })

  const inputData = new InputData()
  inputData.addInput(jsonInput)

  const { lines } = await quicktype({
    inferEnums: false,
    inferBooleanStrings: false,
    inferDateTimes: false,
    inferIntegerStrings: false,
    inferUuids: false,
    inputData,
    lang: "typescript",
    rendererOptions: {
      "just-types": "true",
      "prefer-types": "true",
      readonly: "true",
      "runtime-typecheck": "false",
    },
  })

  const types = lines
    .join("\n")
    .replaceAll(/^export type /gm, "type ")
    .split("\n")
    .map((line) => (line ? `  ${line}` : ""))
    .join("\n")

  return [
    `declare module "sitex:content" {`,
    types,
    `  type Pages = Page[]`,
    `  export function getPages(prefix?: string): Promise<Pages>`,
    `  export function getPage(path: string): Promise<Page | undefined>`,
    `}`,
    "",
  ].join("\n")
}

function createVirtualRenderCode() {
  return [
    `import { getRoutes } from ${JSON.stringify(virtualRoutesId)}`,
    `import { injectRouteHtmlAssets, renderRouteHtml } from ${JSON.stringify(packageFile("router/index", "tsx"))}`,
    `import { findRoute } from ${JSON.stringify(packageFile("router/routes", "ts"))}`,
    `export { getRoutes, injectRouteHtmlAssets }`,
    `export async function render(url, options = {}) {`,
    `  const routes = await getRoutes()`,
    `  const route = findRoute(routes, url)`,
    `  if (!route) return undefined`,
    `  return renderRouteHtml(route, options)`,
    `}`,
  ].join("\n")
}

function routePathToHtmlFile(root: string, routePath: string) {
  const normalizedRoutePath = routePath.replace(/^\/+|\/+$/g, "")

  return routePath === "/"
    ? path.join(root, "dist/index.html")
    : path.join(root, "dist", normalizedRoutePath, "index.html")
}

function staticPageFileToPath(file: string) {
  const route = file
    .replace(/^src\/pages/, "")
    .replace(/\/index\.tsx$/, "/")
    .replace(/\.tsx$/, "")

  return normalizeRoutePath(route || "/")
}

function hasRouteParams(file: string) {
  return /\[[^\]]+\]/.test(file)
}

function hasContentExport(code: string) {
  return /\bexport\s+const\s+content\b/.test(code)
}

function readJsonContent(value: unknown, file: string): JsonValue {
  return readJsonValue(value, file, "content", new WeakSet<object>())
}

function readJsonValue(
  value: unknown,
  file: string,
  keyPath: string,
  seen: WeakSet<object>
): JsonValue {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return value
  }

  if (Array.isArray(value)) {
    if (seen.has(value)) {
      throw new Error(`Content export in "${file}" contains a circular value.`)
    }

    seen.add(value)

    const jsonArray = value.map((item, index) => {
      return readJsonValue(item, file, `${keyPath}[${index}]`, seen)
    })

    seen.delete(value)

    return jsonArray
  }

  if (typeof value === "object" && value !== null) {
    if (seen.has(value)) {
      throw new Error(`Content export in "${file}" contains a circular value.`)
    }

    seen.add(value)

    const jsonObject: { [key: string]: JsonValue } = {}

    for (const [key, item] of Object.entries(value)) {
      jsonObject[key] = readJsonValue(item, file, `${keyPath}.${key}`, seen)
    }

    seen.delete(value)

    return jsonObject
  }

  throw new Error(
    `Content export in "${file}" must be JSON-serializable. Unsupported value at ${keyPath}.`
  )
}

function normalizeRoutePath(path: string) {
  if (!path || path === "/") return "/"
  return `/${path.replace(/^\/+|\/+$/g, "")}`
}

async function readManifest(root: string): Promise<Manifest> {
  const file = path.join(root, "dist/.vite/manifest.json")
  return JSON.parse(await readFile(file, "utf8")) as Manifest
}

function readStylesheetAssets(manifest: Manifest) {
  const assets = new Set<string>()

  for (const entry of Object.values(manifest)) {
    if (entry?.file?.endsWith(".css")) assets.add(publicAssetPath(entry.file))

    for (const cssFile of entry?.css ?? []) {
      assets.add(publicAssetPath(cssFile))
    }
  }

  return [...assets]
}

function readDevStylesheetHrefs(server: ViteDevServer) {
  const hrefs = new Set<string>()

  for (const module of server.moduleGraph.idToModuleMap.values()) {
    const id = module.id?.split("?")[0]

    if (!id?.endsWith(".css")) continue

    hrefs.add(devServerFilePath(id))
  }

  return [...hrefs]
}

function renderStylesheetTags(hrefs: string[]) {
  return hrefs.map((href) => `<link href="${href}" rel="stylesheet">`).join("")
}

function stripViteClientScript(html: string) {
  return html.replace(
    /<script\b[^>]*\bsrc=(["'])\/@vite\/client\1[^>]*>\s*<\/script>/g,
    ""
  )
}

function publicAssetPath(file: string) {
  return `/${file.replace(/^\/+/, "")}`
}

function packageFile(file: string, sourceExtension: "ts" | "tsx") {
  const extension = packageSourceExtension === ".js" ? "js" : sourceExtension

  return path.join(packageRoot, `${file}.${extension}`)
}

function devServerFileUrl(file: string, sourceExtension: "ts" | "tsx") {
  return `/@fs/${packageFile(file, sourceExtension).replaceAll(path.sep, "/")}`
}

function devServerFilePath(file: string) {
  return `/@fs/${file.replaceAll(path.sep, "/")}`
}
