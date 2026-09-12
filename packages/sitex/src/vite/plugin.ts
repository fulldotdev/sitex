import type {
  Connect,
  Plugin,
  PluginOption,
  PreviewServer,
  ResolvedConfig,
  UserConfig,
  ViteBuilder,
  ViteDevServer,
} from "vite-plus"
import { isRunnableDevEnvironment, normalizePath } from "vite-plus"

import { readFile, rm } from "node:fs/promises"
import path from "node:path"

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
import { matchRoute } from "../router/runtime.ts"
import { createMissingSiteUrlError } from "../site/config.ts"
import { createBuildInput, readRouteStylesheetHrefs } from "./css.ts"
import {
  applyGlobalsLocales,
  createGlobalsModuleCode,
  isGlobalsFile,
  resolveGlobalsFile,
  writeGlobalsTypes,
} from "./globals.ts"
import { createTsxPageError, isTsxPageFile, transformMdxPage } from "./mdx.ts"
import {
  createRenderConfig,
  resolveSitexOptions,
  type ResolvedSitexOptions,
  type SitexOptions,
} from "./options.ts"
import {
  collectOutputChunks,
  createGeneratedFavicon,
  hasPublicFile,
  routePathToHtmlFile,
  writeStaticHtml,
} from "./output.ts"
import {
  devServerFileUrl,
  globalsDir,
  packageFile,
  ssrBuildDir,
} from "./paths.ts"
import { collectIslandEntryPatterns } from "./optimize.ts"
import { writeMdxTypecheckFiles } from "./typecheck.ts"
import {
  createJavaScriptModule,
  createPagesModuleCode,
  createVirtualRoutesCode,
  invalidateMdxPageModules,
  invalidateVirtualModules,
  resolvedVirtualGlobalsId,
  resolvedVirtualPagesId,
  resolvedVirtualRoutesId,
  virtualGlobalsId,
  virtualPagesId,
  virtualRoutesId,
} from "./virtual.ts"

export type { SitexOptions } from "./options.ts"

type RenderModule = typeof import("../render/render.tsx")

const isHtmlRequest = (req: Connect.IncomingMessage) => {
  if (!req.url || (req.method !== "GET" && req.method !== "HEAD")) return false
  if (req.url.includes(".")) return false

  const accept = req.headers.accept ?? ""
  return accept.includes("text/html") || accept.includes("*/*")
}

export function sitex(options: SitexOptions = {}): PluginOption[] {
  return [
    sitexPlugin(resolveSitexOptions(options)),
    sitexMdxImportResolvePlugin(),
  ]
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
        optimizeDeps: {
          entries: collectIslandEntryPatterns(configRoot),
          include: ["react", "react-dom/client", "react/jsx-runtime"],
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

      // The client and ssr environments both run buildStart. Generated type
      // files are shared, so only one environment may write them or the
      // concurrent rm/write cycles race each other.
      if (writesGeneratedFiles(this.environment.name)) {
        writeGlobalsTypes(root, options)
        await writeMdxTypecheckFiles(root, options)
      }
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

        // Browser bundles get a wrapper that only reproduces the island
        // markup; the server wrapper prerenders children with react-dom/static.
        const islandModule =
          this.environment.name === "client"
            ? packageFile("hydration/island-client", "tsx")
            : packageFile("hydration/server", "tsx")

        return transformClientDirectives(
          code,
          id,
          root,
          hydration,
          normalizePath(islandModule)
        )
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

        if (writesGeneratedFiles(this.environment.name)) {
          if (file.includes("/src/pages/") && file.endsWith(".mdx")) {
            await writeMdxTypecheckFiles(root, options)
          }

          if (isGlobalsFile(relativeFile)) {
            writeGlobalsTypes(root, options)
          }
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

function writesGeneratedFiles(environmentName: string) {
  return environmentName === "ssr"
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

async function importServerModule(server: ViteDevServer, id: string) {
  const environment = server.environments.ssr

  if (!isRunnableDevEnvironment(environment)) {
    throw new Error(
      `Sitex requires a runnable Vite server environment to import "${id}".`
    )
  }

  return environment.runner.import(id)
}

function renderReactRefreshFallbackScript() {
  return `<script>window.$RefreshReg$ ||= () => {}; window.$RefreshSig$ ||= () => (type) => type;</script>`
}
