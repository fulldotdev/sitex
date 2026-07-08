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
  ViteBuilder,
  ViteDevServer,
} from "vite-plus"
import { isRunnableDevEnvironment, normalizePath } from "vite-plus"

import { randomUUID } from "node:crypto"
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import {
  access,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import fg from "fast-glob"
import { defineHastPlugin, mdxToJs } from "satteri"
import { parse as parseYaml } from "yaml"

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
import { escapeHtmlAttribute as escapeXml } from "../render/html.ts"
import type { RenderConfig } from "../render/render.tsx"
import { validatePageFrontmatter } from "../router/frontmatter.ts"
import {
  matchRoute,
  pageFileToRoutePath,
  resolveRouteLocale,
  routePathToPublicPath,
  type JsonValue,
  type MarkdownHeading,
  type Route,
} from "../router/runtime.ts"
import {
  createMissingSiteUrlError,
  resolveSiteConfig,
  type ResolvedSiteConfig,
  type SiteConfig,
} from "../site/config.ts"

const packageRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const packageSourceExtension = path.extname(fileURLToPath(import.meta.url))
const islandClientInput = normalizePath(packageFile("hydration/client", "tsx"))
const prefetchClientInput = normalizePath(packageFile("prefetch/client", "ts"))
const virtualRoutesId = "virtual:sitex-routes"
const resolvedVirtualRoutesId = `\0${virtualRoutesId}`
const virtualPagesId = "sitex:pages"
const resolvedVirtualPagesId = `\0${virtualPagesId}`
const virtualGlobalsId = "sitex:globals"
const resolvedVirtualGlobalsId = `\0${virtualGlobalsId}`
const clientBuildDir = ".sitex/client"
const mdxTypecheckDir = ".sitex/typecheck"
const ssrBuildDir = ".sitex/ssr"
const globalsDir = "src/globals"

type RenderModule = typeof import("../render/render.tsx")

export type SitexOptions = {
  site?: SiteConfig
  prefetch?: boolean
  favicon?:
    | false
    | {
        background?: string
        color?: string
        text?: string
      }
  mdx?: {
    components?: Record<string, string>
  }
  trailingSlash?: boolean
}

type ResolvedSitexOptions = {
  favicon:
    | false
    | {
        background: string
        color: string
        text?: string
      }
  site: ResolvedSiteConfig
  locales: string[]
  prefetch: boolean
  mdx: {
    components: Record<string, string>
  }
  trailingSlash: boolean
}

const isHtmlRequest = (req: Connect.IncomingMessage) => {
  if (!req.url || (req.method !== "GET" && req.method !== "HEAD")) return false
  if (req.url.includes(".")) return false

  const accept = req.headers.accept ?? ""
  return accept.includes("text/html") || accept.includes("*/*")
}

export function sitex(options: SitexOptions = {}): PluginOption[] {
  const resolvedOptions: ResolvedSitexOptions = {
    favicon: resolveFaviconOptions(options.favicon),
    site: resolveSiteConfig(options.site),
    locales: [],
    prefetch: options.prefetch !== false,
    mdx: {
      components: validateMdxComponentImports(options.mdx?.components),
    },
    trailingSlash: options.trailingSlash ?? false,
  }
  return [sitexPlugin(resolvedOptions), sitexMdxImportResolvePlugin()]
}

/**
 * Vite's tsconfig-paths resolution only applies to TS/JS importers, so
 * aliases like "@/components/alert" fail inside MDX pages. Retry failed
 * resolutions from .mdx importers with a synthetic .tsx importer path.
 */
function sitexMdxImportResolvePlugin(): Plugin {
  return {
    name: "sitex:mdx-import-resolve",

    async resolveId(id, importer, options) {
      if (!importer?.endsWith(".mdx")) return
      if (id.startsWith(".") || id.startsWith("\0")) return

      const resolved = await this.resolve(id, importer, options)

      if (resolved) return resolved

      return this.resolve(id, `${importer}.tsx`, options)
    },
  }
}

function validateMdxComponentImports(
  components: Record<string, string> | undefined
) {
  if (!components) return {}

  const validated: Record<string, string> = {}

  for (const [name, moduleId] of Object.entries(components)) {
    if (
      !/^[A-Za-z][A-Za-z0-9-]*$/.test(name) ||
      name === "constructor" ||
      name === "prototype" ||
      name === "__proto__"
    ) {
      throw new Error(
        `Invalid MDX component name "${name}". Use a tag name like "pre" or "h2".`
      )
    }

    if (typeof moduleId !== "string" || moduleId.trim() === "") {
      throw new Error(
        `MDX component "${name}" must point to a non-empty import path.`
      )
    }

    validated[name] = moduleId
  }

  return validated
}

function resolveFaviconOptions(options: SitexOptions["favicon"]) {
  if (options === false) return false

  if (options !== undefined && (!options || typeof options !== "object")) {
    throw new Error(`Sitex favicon config must be an object or false.`)
  }

  return {
    background: options?.background ?? "#111827",
    color: options?.color ?? "#ffffff",
    text: options?.text,
  }
}

function sitexPlugin(options: ResolvedSitexOptions): Plugin {
  let root = process.cwd()
  let config: ResolvedConfig
  let cleanedBuildOutput = false
  const hydration: HydrationRegistry = new Map()

  return {
    name: "sitex",
    enforce: "pre",

    config(userConfig): UserConfig {
      const configRoot = path.resolve(userConfig.root ?? process.cwd())

      applyGlobalsLocales(configRoot, options)
      writeGlobalsTypes(configRoot, options)

      return {
        appType: "custom",
        builder: {},
        resolve: {
          dedupe: ["react", "react-dom"],
          tsconfigPaths: true,
        },
        build: {
          assetsDir: "assets",
          manifest: true,
          outDir: "dist",
          emptyOutDir: false,
        },
        environments: {
          client: {
            build: {
              rollupOptions: {
                input: createBuildInput(configRoot, options.prefetch),
              },
            },
          },
          ssr: {
            resolve: {
              noExternal: ["parse5"],
            },
            build: {
              copyPublicDir: false,
              emptyOutDir: true,
              manifest: false,
              outDir: ssrBuildDir,
              rollupOptions: {
                input: { render: packageFile("render/render", "tsx") },
                output: {
                  chunkFileNames: "chunks/[name]-[hash].mjs",
                  entryFileNames: "[name].mjs",
                },
              },
            },
          },
        },
      }
    },

    configResolved(resolvedConfig) {
      config = resolvedConfig
      root = resolvedConfig.root
      applyGlobalsLocales(root, options)

      if (!options.site.url) {
        if (resolvedConfig.command === "build")
          throw createMissingSiteUrlError()

        options.site.url = "http://localhost"
      }
    },

    async buildStart() {
      hydration.clear()

      // Environments build with separate plugin instances, so gate the dist
      // clean on the client environment instead of instance state alone.
      if (
        config.command === "build" &&
        this.environment.name === "client" &&
        !cleanedBuildOutput
      ) {
        cleanedBuildOutput = true
        await rm(path.join(root, "dist"), { recursive: true, force: true })
      }

      writeGlobalsTypes(root, options)

      const files = await fg("src/**/*.tsx", {
        cwd: root,
        onlyFiles: true,
      })
      const pageFiles = files.filter(isTsxPageFile)

      if (pageFiles.length > 0) {
        throw new Error(createTsxPageError(pageFiles.join('", "')))
      }

      await Promise.all(
        files.map(async (file) => {
          const absoluteFile = path.join(root, file)
          const code = await readFile(absoluteFile, "utf8")
          collectHydrationEntries(code, absoluteFile, root, hydration)
        })
      )

      await writeMdxTypecheckFiles(root, options)
    },

    resolveId: {
      filter: {
        id: /^(virtual:sitex-islands|virtual:sitex-routes|sitex:pages|sitex:globals)$/,
      },
      handler(id) {
        if (id === virtualHydrationId) return resolvedVirtualHydrationId
        if (id === virtualRoutesId) return resolvedVirtualRoutesId
        if (id === virtualPagesId) return resolvedVirtualPagesId
        if (id === virtualGlobalsId) return resolvedVirtualGlobalsId
      },
    },

    load: {
      filter: {
        id: /^(\0virtual:sitex-islands|\0virtual:sitex-routes|\0sitex:pages|\0sitex:globals)$/,
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

        if (id === resolvedVirtualPagesId) {
          return createJavaScriptModule(createPagesModuleCode(options))
        }

        if (id === resolvedVirtualGlobalsId) {
          this.addWatchFile(resolveGlobalsFile(root, options))

          for (const locale of options.locales) {
            this.addWatchFile(resolveGlobalsFile(root, options, locale))
          }

          return createJavaScriptModule(createGlobalsModuleCode(root, options))
        }
      },
    },

    transform: {
      filter: {
        id: /\.(tsx|mdx)$/,
      },
      async handler(code, id) {
        if (id.endsWith(".mdx")) {
          return transformMdxPage(code, id, root, options)
        }

        const file = normalizePath(path.relative(root, id))

        if (isTsxPageFile(file)) {
          throw new Error(createTsxPageError(file))
        }

        if (!id.endsWith(".tsx") || !code.includes("client:")) return

        return transformClientDirectives(code, id, root, hydration)
      },
    },

    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.split("?")[0] !== "/favicon.svg") {
          next()
          return
        }

        if (await hasPublicFile(root, "favicon.svg")) {
          next()
          return
        }

        const favicon = createGeneratedFavicon(root, options)

        if (!favicon) {
          next()
          return
        }

        res.statusCode = 200
        res.setHeader("Content-Type", "image/svg+xml")
        res.end(req.method === "HEAD" ? undefined : favicon)
      })

      server.middlewares.use(async (req, res, next) => {
        if (!isHtmlRequest(req)) {
          next()
          return
        }

        const url = req.url?.split("?")[0] ?? "/"

        try {
          const render = (await importServerModule(
            server,
            normalizePath(packageFile("render/render", "tsx"))
          )) as RenderModule
          const routes = await render.getRoutes()
          const route = matchRoute(routes, url)

          if (!route) {
            next()
            return
          }

          const html = await render.renderRoute(
            route,
            { ...createRenderConfig(options), prefetch: false },
            () => ({
              islandClientPreamble: renderReactRefreshFallbackScript(),
              islandClientSrc: devServerFileUrl("hydration/client", "tsx"),
              stylesheetHrefs: readRouteStylesheetHrefs(
                server.environments.ssr.moduleGraph,
                root,
                route.file
              ),
            })
          )
          const pageHtml = await server.transformIndexHtml(url, html)

          res.statusCode = 200
          res.setHeader("Content-Type", "text/html")
          res.end(req.method === "HEAD" ? undefined : pageHtml)
        } catch (error) {
          next(error)
        }
      })
    },

    configurePreviewServer(server: PreviewServer) {
      return () => {
        server.middlewares.use(async (req, res, next) => {
          if (!isHtmlRequest(req)) {
            next()
            return
          }

          const url = req.url?.split("?")[0] ?? "/"
          const file = routePathToHtmlFile(
            path.join(root, "dist"),
            url,
            options.trailingSlash
          )

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
      async handler(update) {
        const file = normalizePath(update.file)
        const relativeFile = normalizePath(path.relative(root, file))

        if (isTsxPageFile(relativeFile)) {
          config.logger.error(`[sitex] ${createTsxPageError(relativeFile)}`)
          return []
        }

        if (!shouldReloadForFile(file)) return

        invalidateVirtualModules(this.environment.moduleGraph, update.timestamp)

        // Layout exports drive the generated MDX page code (mdxComponents
        // detection), so layout changes must re-transform MDX pages.
        if (file.includes("/src/layouts/")) {
          invalidateMdxPageModules(
            this.environment.moduleGraph,
            update.timestamp
          )
        }

        if (file.includes("/src/pages/") && file.endsWith(".mdx")) {
          await writeMdxTypecheckFiles(root, options)
        }

        if (isGlobalsFile(relativeFile)) {
          writeGlobalsTypes(root, options)
        }

        this.environment.hot.send({ type: "full-reload" })
        return []
      },
    },

    async buildApp(builder: ViteBuilder) {
      const client = builder.environments.client
      const ssr = builder.environments.ssr

      if (!client || !ssr) {
        throw new Error(
          "Sitex requires the client and ssr build environments to build the app."
        )
      }

      await builder.build(client)

      const ssrResult = await builder.build(ssr)

      await writeStaticHtml(root, options, collectOutputChunks(ssrResult))
    },
  }
}

function createJavaScriptModule(code: string) {
  return {
    code,
    moduleType: "js",
  }
}

function createBuildInput(root: string, prefetch: boolean) {
  const clientEntries = writeClientBuildEntriesSync(root)
  const input: Record<string, string> = {
    islandClient: clientEntries.islandClient,
  }

  if (prefetch) input.prefetchClient = clientEntries.prefetchClient

  for (const [file, entry] of clientEntries.styles) {
    const name = file.replace(/^src\//, "").replace(/\.css$/, "")

    input[name] = entry
  }

  return input
}

function writeClientBuildEntriesSync(root: string) {
  const clientRoot = path.join(root, clientBuildDir)
  const styles = new Map<string, string>()

  rmSync(clientRoot, { recursive: true, force: true })
  mkdirSync(clientRoot, { recursive: true })

  const islandClient = path.join(clientRoot, "island-client.ts")
  writeFileSync(islandClient, `import ${JSON.stringify(islandClientInput)}\n`)

  const prefetchClient = path.join(clientRoot, "prefetch-client.ts")
  writeFileSync(
    prefetchClient,
    `import ${JSON.stringify(prefetchClientInput)}\n`
  )

  for (const file of collectStyleFilesSync(root)) {
    const entry = path.join(
      clientRoot,
      `${file.replace(/^src\//, "").replace(/\.css$/, "")}.ts`
    )

    mkdirSync(path.dirname(entry), { recursive: true })
    writeFileSync(entry, createStyleEntryCode(root, file))
    styles.set(file, entry)
  }

  return { islandClient, prefetchClient, styles }
}

function createStyleEntryCode(root: string, file: string) {
  return `import ${JSON.stringify(path.join(root, file))}\n`
}

type BuildOutputChunk = {
  facadeModuleId: string | null
  fileName: string
  imports: string[]
  moduleIds: string[]
  type: "chunk"
}

function collectOutputChunks(result: unknown): BuildOutputChunk[] {
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

function createRenderConfig(options: ResolvedSitexOptions): RenderConfig {
  return {
    defaultLocale: options.site.locale,
    faviconHref: options.favicon === false ? undefined : "/favicon.svg",
    locales: options.locales,
    prefetch: options.prefetch,
    siteUrl: options.site.url,
    trailingSlash: options.trailingSlash,
  }
}

async function writeStaticHtml(
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

async function hasPublicFile(root: string, file: string) {
  try {
    await access(path.join(root, "public", file))
    return true
  } catch {
    return false
  }
}

function createGeneratedFavicon(root: string, options: ResolvedSitexOptions) {
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

function readGlobalsNameSync(root: string, options: ResolvedSitexOptions) {
  try {
    const globals = readGlobalsData(root, options)
    const name = globals.name

    return typeof name === "string" && name.trim() ? name : undefined
  } catch {
    return undefined
  }
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

function collectStyleFilesSync(root: string) {
  return fg.sync("src/**/*.css", {
    cwd: root,
    onlyFiles: true,
  })
}

function writeGlobalsTypes(root: string, options: ResolvedSitexOptions) {
  const globals = readGlobalsData(root, options)
  const typeFile = path.join(root, ".sitex/globals.d.ts")

  mkdirSync(path.dirname(typeFile), { recursive: true })
  writeFileSync(typeFile, createGlobalsTypesCode(globals, options.locales))
}

function createGlobalsModuleCode(root: string, options: ResolvedSitexOptions) {
  const globals = readGlobalsData(root, options)
  const locales: { [key: string]: JsonValue } = {}

  for (const locale of options.locales) {
    locales[locale] = readGlobalsData(root, options, locale)
  }

  return [
    `export const globals = ${JSON.stringify(globals)}`,
    `export const locales = ${JSON.stringify(locales)}`,
    `export default globals`,
    "",
  ].join("\n")
}

function readGlobalsData(
  root: string,
  options: ResolvedSitexOptions,
  locale?: string
) {
  const file = resolveGlobalsFile(root, options, locale)
  let source: string

  try {
    source = readFileSync(file, "utf8")
  } catch {
    throw new Error(
      locale
        ? `Sitex requires ${globalsDir}/${locale}.yaml for the "${locale}" locale.`
        : `Sitex requires ${globalsDir}/index.yaml. Create it for global layout content.`
    )
  }

  return parseGlobalsYaml(source, normalizePath(path.relative(root, file)))
}

function resolveGlobalsFile(
  root: string,
  options: ResolvedSitexOptions,
  locale?: string
) {
  const names = locale ? [locale] : ["index", options.site.locale]

  for (const name of names) {
    for (const extension of ["yaml", "yml"]) {
      const file = path.join(root, globalsDir, `${name}.${extension}`)

      if (readFileSyncSafe(file)) return file
    }
  }

  return path.join(root, globalsDir, `${names[0]}.yaml`)
}

/**
 * Globals filenames define the site locales: index.yaml serves the root
 * locale (named by site.locale) and every other file, like en.yaml, serves
 * routes under its /{locale} prefix. A single named file without index.yaml
 * serves the root and sets the locale name.
 */
function applyGlobalsLocales(root: string, options: ResolvedSitexOptions) {
  const files = fg.sync(["*.yaml", "*.yml"], {
    cwd: path.join(root, globalsDir),
    onlyFiles: true,
  })
  const names = [
    ...new Set(files.map((file) => file.replace(/\.ya?ml$/, ""))),
  ].sort()

  if (names.includes("index")) {
    options.locales = names.filter((name) => name !== "index")
    return
  }

  const [only] = names

  if (names.length === 1 && only) {
    options.site.locale = only
    options.locales = []
    return
  }

  if (names.length === 0) {
    options.locales = []
    return
  }

  throw new Error(
    `Sitex found multiple globals files in ${globalsDir} without an index file. Add ${globalsDir}/index.yaml for the root locale; every other file like en.yaml serves /en routes.`
  )
}

function parseGlobalsYaml(source: string, file: string) {
  const value = parseYaml(source)

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Globals in "${file}" must be a YAML object.`)
  }

  return readJsonData(value, file)
}

function createGlobalsTypesCode(
  globals: { [key: string]: JsonValue },
  localeNames: readonly string[]
) {
  const localesKey =
    localeNames.length === 0
      ? "never"
      : localeNames.map((name) => JSON.stringify(name)).join(" | ")

  return [
    `declare module "sitex:globals" {`,
    `  export interface Globals ${createJsonType(globals)}`,
    `  const globals: Globals`,
    `  export const locales: Readonly<Record<${localesKey}, Globals>>`,
    `  export { globals }`,
    `  export default globals`,
    `}`,
    "",
  ].join("\n")
}

function createJsonType(value: JsonValue): string {
  if (typeof value === "string") return JSON.stringify(value)
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }
  if (value === null) return "null"

  if (Array.isArray(value)) {
    return `readonly [${value.map(createJsonType).join(", ")}]`
  }

  const entries = Object.entries(value).map(([key, item]) => {
    return `readonly ${JSON.stringify(key)}: ${createJsonType(item)}`
  })

  return `{ ${entries.join("; ")} }`
}

async function removeGeneratedDirectory(directory: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await rm(directory, { recursive: true, force: true })
      return
    } catch (error) {
      if (attempt === 2 || !isRetryableRemoveError(error)) throw error
      await new Promise((resolve) => setTimeout(resolve, 25))
    }
  }
}

function isRetryableRemoveError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error.code === "ENOTEMPTY" || error.code === "EBUSY")
  )
}

function isTsxPageFile(file: string) {
  return file.startsWith("src/pages/") && file.endsWith(".tsx")
}

function createTsxPageError(file: string) {
  return `Sitex pages are MDX files. Found TSX file "${file}" in src/pages. Move the page markup into a layout in src/layouts and create an MDX page that selects it with "layout" frontmatter.`
}

function shouldReloadForFile(file: string) {
  return (
    file.includes("/src/pages/") ||
    file.includes("/src/layouts/") ||
    file.includes("/src/components/") ||
    file.includes("/src/data/") ||
    file.includes(`/${globalsDir}/`) ||
    file.endsWith(".css")
  )
}

function isGlobalsFile(file: string) {
  return (
    file.startsWith(`${globalsDir}/`) &&
    (file.endsWith(".yaml") || file.endsWith(".yml"))
  )
}

function invalidateVirtualModules(
  moduleGraph: EnvironmentModuleGraph,
  timestamp: number
) {
  const invalidatedModules = new Set<EnvironmentModuleNode>()

  for (const id of [
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

function invalidateMdxPageModules(
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

async function transformMdxPage(
  code: string,
  id: string,
  root: string,
  options: ResolvedSitexOptions
) {
  const file = normalizePath(path.relative(root, id))

  if (!file.startsWith("src/pages/")) {
    throw new Error(
      `MDX file "${file}" is outside src/pages. Sitex only renders MDX pages; move prose into a page or a component.`
    )
  }

  const { headings, result } = compileMdxCached(root, file, code)
  const { data, layoutFile, layoutHasMdxComponents } =
    await readMdxPageMetadata(root, file, result.frontmatter, headings)
  const routePath = pageFileToRoutePath(file)
  const pagePath = routePathToPublicPath(routePath, options.trailingSlash)
  const pageUrl = createPageUrl(options.site.url, pagePath)
  const pageLocale = resolveRouteLocale(
    routePath,
    options.locales,
    options.site.locale
  )

  if (
    /\bexport\s+(?:const|let|var|function|class)\s+data\b/.test(result.code)
  ) {
    throw new Error(
      `MDX page "${file}" cannot export "data". Page data comes from frontmatter.`
    )
  }

  const mdxCode = result.code.replace(
    /export\s+default\s+MDXContent\s*;?\s*$/,
    "const _sitexMarkdownContent = MDXContent;"
  )

  if (mdxCode === result.code) {
    throw new Error(
      `Satteri did not emit the expected MDX component for "${file}".`
    )
  }

  return [
    mdxCode,
    ...createMdxComponentImportCode(options.mdx.components),
    `import * as _sitexLayoutModule from ${JSON.stringify(`/${normalizePath(path.relative(root, layoutFile))}`)}`,
    `const _sitexLayout = _sitexLayoutModule.default`,
    layoutHasMdxComponents
      ? `const _sitexMdxComponents = Object.assign({}, _sitexConfiguredMdxComponents, _sitexLayoutModule.mdxComponents)`
      : `const _sitexMdxComponents = _sitexConfiguredMdxComponents`,
    `export const data = ${JSON.stringify(data)}`,
    `export default function _SitexMdxPage() {`,
    `  const { layout: _layout, ...props } = data`,
    `  return _jsx(_sitexLayout, Object.assign({}, props, { path: ${JSON.stringify(pagePath)}, url: ${JSON.stringify(pageUrl)}, locale: ${JSON.stringify(pageLocale)}, headings: data.headings, children: _jsx(_sitexMarkdownContent, { components: _sitexMdxComponents }) }))`,
    `}`,
  ].join("\n")
}

function createMdxComponentImportCode(components: Record<string, string>) {
  const entries = Object.entries(components)

  return [
    ...entries.map(
      ([, moduleId], index) =>
        `import _sitexMdxComponent${index} from ${JSON.stringify(moduleId)}`
    ),
    entries.length === 0
      ? `const _sitexConfiguredMdxComponents = {}`
      : `const _sitexConfiguredMdxComponents = { ${entries
          .map(
            ([name], index) =>
              `${JSON.stringify(name)}: _sitexMdxComponent${index}`
          )
          .join(", ")} }`,
  ]
}

async function writeMdxTypecheckFiles(
  root: string,
  options: ResolvedSitexOptions
) {
  const typecheckRoot = path.join(root, mdxTypecheckDir)
  const files = await fg("src/pages/**/*.mdx", {
    cwd: root,
    onlyFiles: true,
  })

  await removeGeneratedDirectory(typecheckRoot)

  await Promise.all(
    files.map(async (file) => {
      const code = await readFile(path.join(root, file), "utf8")
      const { headings, result } = compileMdxCached(root, file, code)
      const { data, layoutFile } = await readMdxPageMetadata(
        root,
        file,
        result.frontmatter,
        headings
      )
      const routePath = pageFileToRoutePath(file)
      const pagePath = routePathToPublicPath(routePath, options.trailingSlash)
      const pageUrl = createPageUrl(options.site.url, pagePath)
      const typecheckFile = path.join(typecheckRoot, `${file}.tsx`)

      await mkdir(path.dirname(typecheckFile), { recursive: true })
      await writeFileAtomic(
        typecheckFile,
        createMdxTypecheckCode(typecheckFile, layoutFile, data, {
          locale: resolveRouteLocale(
            routePath,
            options.locales,
            options.site.locale
          ),
          path: pagePath,
          url: pageUrl,
        })
      )
    })
  )
}

async function readMdxPageMetadata(
  root: string,
  file: string,
  frontmatter: { kind: string; value: string } | null | undefined,
  headings: MarkdownHeading[] = []
) {
  const frontmatterData = parseMdxFrontmatter(frontmatter, file)

  validatePageFrontmatter(frontmatterData, file)

  const data: { [key: string]: JsonValue } = {
    ...frontmatterData,
    headings: headings as unknown as JsonValue,
  }
  const layout = data.layout as string

  const layoutFile = normalizePath(
    path.join(root, "src/layouts", `${layout}.tsx`)
  )

  let layoutSource: string

  try {
    layoutSource = await readFile(layoutFile, "utf8")
  } catch {
    throw new Error(
      `MDX page "${file}" references missing layout "src/layouts/${layout}.tsx".`
    )
  }

  return {
    data,
    layoutFile,
    layoutHasMdxComponents: hasMdxComponentsExport(layoutSource),
  }
}

function hasMdxComponentsExport(source: string) {
  return /\bexport\s+(?:const|let|var|function|class)\s+mdxComponents\b|\bexport\s*\{[^}]*\bmdxComponents\b/.test(
    source
  )
}

function createMdxTypecheckCode(
  typecheckFile: string,
  layoutFile: string,
  data: { [key: string]: JsonValue },
  page: {
    locale: string
    path: string
    url: string
  }
) {
  const dataEntries = Object.keys(data)
    .filter(
      (key) =>
        key !== "layout" &&
        key !== "path" &&
        key !== "url" &&
        key !== "locale" &&
        key !== "headings" &&
        key !== "children"
    )
    .map((key) => `  ${JSON.stringify(key)}: data[${JSON.stringify(key)}],`)

  return [
    `import type { ComponentProps } from "react"`,
    `import Layout from ${JSON.stringify(createRelativeImport(typecheckFile, layoutFile))}`,
    ``,
    `const data = ${JSON.stringify(data, null, 2)} as const`,
    `const layoutProps = {`,
    ...dataEntries,
    `  path: ${JSON.stringify(page.path)},`,
    `  url: ${JSON.stringify(page.url)},`,
    `  locale: ${JSON.stringify(page.locale)},`,
    `  headings: data.headings,`,
    `} satisfies Omit<ComponentProps<typeof Layout>, "children">`,
    ``,
    `export const typecheck = <Layout {...layoutProps}>{null}</Layout>`,
    ``,
  ].join("\n")
}

const mdxCompileCache = new Map<
  string,
  { source: string; compiled: ReturnType<typeof compileMdx> }
>()

function compileMdxCached(root: string, file: string, code: string) {
  const key = `${root}:${file}`
  const cached = mdxCompileCache.get(key)

  if (cached && cached.source === code) return cached.compiled

  const compiled = compileMdx(code)

  mdxCompileCache.set(key, { source: code, compiled })

  return compiled
}

function compileMdx(code: string) {
  const headings: MarkdownHeading[] = []
  const usedSlugs = new Map<string, number>()

  const result = mdxToJs(code, {
    development: false,
    hastPlugins: [
      defineHastPlugin({
        name: "sitex-heading-metadata",
        element: {
          filter: ["h1", "h2", "h3", "h4", "h5", "h6"],
          visit(node, context) {
            const label = context.textContent(node).replace(/\s+/g, " ").trim()
            const depth = Number(node.tagName.slice(1))
            const existingId = readHeadingId(node.properties.id)
            const id = existingId || createUniqueSlug(label, usedSlugs)

            if (existingId) {
              usedSlugs.set(existingId, (usedSlugs.get(existingId) ?? 0) + 1)
            } else {
              context.setProperty(node, "id", id)
            }

            headings.push({
              depth,
              href: `#${id}`,
              id,
              label,
            })
          },
        },
      }),
    ],
    jsxImportSource: "react",
  })

  return { headings, result }
}

function readHeadingId(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined
}

function createUniqueSlug(label: string, usedSlugs: Map<string, number>) {
  const base = slugifyHeading(label) || "section"
  const count = usedSlugs.get(base) ?? 0

  usedSlugs.set(base, count + 1)

  return count === 0 ? base : `${base}-${count + 1}`
}

function slugifyHeading(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function createRelativeImport(fromFile: string, toFile: string) {
  const specifier = normalizePath(path.relative(path.dirname(fromFile), toFile))

  return specifier.startsWith(".") ? specifier : `./${specifier}`
}

function createVirtualRoutesCode() {
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

function createPagesModuleCode(options: ResolvedSitexOptions) {
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

function routePathToHtmlFile(
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

function parseMdxFrontmatter(
  frontmatter: { kind: string; value: string } | null | undefined,
  file: string
) {
  if (!frontmatter) {
    throw new Error(`MDX page "${file}" must define frontmatter.`)
  }

  if (frontmatter.kind !== "yaml") {
    throw new Error(`MDX page "${file}" must use YAML frontmatter.`)
  }

  const value = parseYaml(frontmatter.value)

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Frontmatter in "${file}" must be an object.`)
  }

  return readJsonData(value, file)
}

function readJsonData(
  value: unknown,
  file: string
): { [key: string]: JsonValue } {
  const data = readJsonValue(value, file, "data", new WeakSet<object>())

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`Data in "${file}" must be a JSON object.`)
  }

  return data
}

function readJsonValue(
  value: unknown,
  file: string,
  keyPath: string,
  seen: WeakSet<object>
): JsonValue {
  if (
    typeof value === "string" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return value
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(
        `Data in "${file}" contains a non-finite number at ${keyPath}.`
      )
    }

    return value
  }

  if (Array.isArray(value)) {
    if (seen.has(value)) {
      throw new Error(`Data in "${file}" contains a circular value.`)
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
      throw new Error(`Data in "${file}" contains a circular value.`)
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
    `Data in "${file}" must be JSON-serializable. Unsupported value at ${keyPath}.`
  )
}

function createPageUrl(siteUrl: string, pagePath: string) {
  return new URL(pagePath, siteUrl).href
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

function renderReactRefreshFallbackScript() {
  return `<script>window.$RefreshReg$ ||= () => {}; window.$RefreshSig$ ||= () => (type) => type;</script>`
}

function readRouteStylesheetHrefs(
  graph: EnvironmentModuleGraph,
  root: string,
  routeFile: string
) {
  return collectRouteCssFiles(graph, root, routeFile).map(devServerFilePath)
}

function readRouteStylesheetAssets(
  chunks: BuildOutputChunk[],
  root: string,
  routeFile: string,
  cssAssetMap: Map<string, string>
) {
  const assets = new Set<string>()

  for (const file of collectRouteCssFilesFromChunks(chunks, root, routeFile)) {
    const asset = cssAssetMap.get(file)

    if (asset) assets.add(asset)
  }

  return [...assets]
}

function collectRouteCssFilesFromChunks(
  chunks: BuildOutputChunk[],
  root: string,
  routeFile: string
) {
  const absoluteRouteFile = normalizePath(path.join(root, routeFile))
  const chunksByFileName = new Map(
    chunks.map((chunk) => [chunk.fileName, chunk])
  )
  const matchesRoute = (id: string) =>
    normalizeModuleFile(root, id) === absoluteRouteFile
  const entry =
    chunks.find(
      (chunk) => chunk.facadeModuleId && matchesRoute(chunk.facadeModuleId)
    ) ?? chunks.find((chunk) => (chunk.moduleIds ?? []).some(matchesRoute))

  if (!entry) return []

  const cssFiles = new Set<string>()
  const seen = new Set<BuildOutputChunk>()
  const queue = [entry]

  while (queue.length > 0) {
    const chunk = queue.pop()

    if (!chunk || seen.has(chunk)) continue

    seen.add(chunk)

    for (const id of chunk.moduleIds ?? []) {
      const file = normalizeCssModuleFile(root, id)

      if (file) cssFiles.add(file)
    }

    for (const imported of chunk.imports ?? []) {
      const next = chunksByFileName.get(imported)

      if (next) queue.push(next)
    }
  }

  return [...cssFiles]
}

function collectRouteCssFiles(
  graph: EnvironmentModuleGraph,
  root: string,
  routeFile: string
) {
  const entry = findRouteModule(graph, root, routeFile)
  const seen = new Set<EnvironmentModuleNode>()
  const cssFiles = new Set<string>()

  function visit(module: EnvironmentModuleNode | undefined) {
    if (!module || seen.has(module)) return

    seen.add(module)

    const file = normalizeCssModuleFile(root, module.file ?? module.id)

    if (file) {
      cssFiles.add(file)
      return
    }

    for (const importedModule of module.importedModules) {
      visit(importedModule)
    }
  }

  visit(entry)

  return [...cssFiles]
}

function findRouteModule(
  graph: EnvironmentModuleGraph,
  root: string,
  routeFile: string
) {
  const absoluteRouteFile = normalizePath(path.join(root, routeFile))

  for (const id of [absoluteRouteFile, `/${routeFile}`, routeFile]) {
    const module = graph.getModuleById(id)

    if (module) return module
  }

  for (const module of graph.idToModuleMap.values()) {
    const moduleFile = normalizeModuleFile(root, module.file ?? module.id)

    if (moduleFile === absoluteRouteFile) return module
  }
}

function normalizeCssModuleFile(
  root: string,
  value: string | null | undefined
) {
  const file = normalizeModuleFile(root, value)

  return file?.endsWith(".css") ? file : undefined
}

function normalizeModuleFile(root: string, value: string | null | undefined) {
  if (!value) return

  const cleanValue = normalizePath(value.split("?")[0] ?? "")

  if (!cleanValue) return

  if (cleanValue.startsWith("/@fs/")) return cleanValue.slice(4)
  if (path.isAbsolute(cleanValue)) return cleanValue
  if (cleanValue.startsWith("/src/")) {
    return normalizePath(path.join(root, cleanValue.slice(1)))
  }
  if (cleanValue.startsWith("src/"))
    return normalizePath(path.join(root, cleanValue))
}

function createCssAssetMap(root: string, manifest: Manifest) {
  const assets = new Map<string, string>()

  for (const [key, entry] of Object.entries(manifest)) {
    const source = entry.src ?? key

    if (!source.endsWith(".css")) {
      const generatedCssFile = readGeneratedStyleEntryCssFile(root, entry)

      if (generatedCssFile) {
        assets.set(generatedCssFile.file, publicAssetPath(generatedCssFile.css))
      }

      continue
    }

    const file = normalizeManifestSourceFile(root, source)

    if (file) assets.set(file, publicAssetPath(entry.file))
  }

  return assets
}

function readGeneratedStyleEntryCssFile(root: string, entry: Manifest[string]) {
  if (!entry.css?.[0]) return
  if (!entry.name) return

  const css = entry.css[0]
  const file = path.join(root, "src", `${entry.name}.css`)

  return css && readFileSyncSafe(file)
    ? { css, file: normalizePath(file) }
    : undefined
}

function readFileSyncSafe(file: string) {
  try {
    readFileSync(file)
    return true
  } catch {
    return false
  }
}

function normalizeManifestSourceFile(root: string, source: string) {
  const cleanSource = normalizePath(source.split("?")[0] ?? "")

  if (path.isAbsolute(cleanSource)) return cleanSource
  if (cleanSource.startsWith("/")) {
    return normalizePath(path.join(root, cleanSource.slice(1)))
  }

  return normalizePath(path.join(root, cleanSource))
}

function readManifestChunkCss(entry: Manifest[string] | undefined) {
  if (!entry) return []

  const assets = new Set<string>()

  if (entry.file.endsWith(".css")) assets.add(publicAssetPath(entry.file))

  for (const cssFile of entry.css ?? []) {
    assets.add(publicAssetPath(cssFile))
  }

  return [...assets]
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
