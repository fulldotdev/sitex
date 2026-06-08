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
} from "vite-plus"
import {
  createServer,
  isRunnableDevEnvironment,
  normalizePath,
} from "vite-plus"

import { randomUUID } from "node:crypto"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import {
  access,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import fg from "fast-glob"
import { nitro } from "nitro/vite"
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

const packageRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const packageSourceExtension = path.extname(fileURLToPath(import.meta.url))
const islandClientInput = normalizePath(packageFile("hydration/client", "tsx"))
const virtualRoutesId = "virtual:sitex-routes"
const resolvedVirtualRoutesId = `\0${virtualRoutesId}`
const virtualRenderId = "virtual:sitex-render"
const resolvedVirtualRenderId = `\0${virtualRenderId}`
const virtualPagesId = "sitex:pages"
const resolvedVirtualPagesId = `\0${virtualPagesId}`
const pagesTypesFile = ".sitex/pages.d.ts"
const clientBuildDir = ".sitex/client"
const mdxTypecheckDir = ".sitex/typecheck"

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

type PageData = {
  path: string
  [key: string]: JsonValue
}

type PageDataRoute = {
  file: string
  path: string
}

type MarkdownHeading = {
  depth: number
  href: string
  id: string
  label: string
}

export type SitexOptions = {
  mdx?: {
    components?: Record<string, string>
  }
  trailingSlash?: boolean
}

type ResolvedSitexOptions = {
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

function shouldGenerateContentTypes() {
  return process.env.SITEX_CONTENT !== "0"
}

export function sitex(options: SitexOptions = {}): PluginOption[] {
  const resolvedOptions: ResolvedSitexOptions = {
    mdx: {
      components: validateMdxComponentImports(options.mdx?.components),
    },
    trailingSlash: options.trailingSlash ?? false,
  }
  const plugins: PluginOption[] = [sitexPlugin(resolvedOptions)]

  if (
    process.env.SITEX_INTERNAL_RENDER !== "1" &&
    hasServerPagesSync(process.cwd())
  ) {
    plugins.push(
      ...(nitro({
        renderer: {
          handler: packageFile("nitro/renderer", "ts"),
        },
        serverDir: ".",
      }) as PluginOption[])
    )
  }

  plugins.push(sitexBuildInputPlugin())

  return plugins
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

function sitexBuildInputPlugin(): Plugin {
  return {
    name: "sitex:build-input",
    enforce: "post",

    config(userConfig): UserConfig {
      const configRoot = path.resolve(userConfig.root ?? process.cwd())

      return {
        build: {
          rollupOptions: {
            input: createBuildInput(configRoot),
          },
        },
      }
    },
  }
}

function sitexPlugin(options: ResolvedSitexOptions): Plugin {
  let root = process.cwd()
  let config: ResolvedConfig
  let cleanedBuildOutput = false
  let wroteStaticHtml = false
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
          rollupOptions: {
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

      if (
        config.command === "build" &&
        !cleanedBuildOutput &&
        process.env.SITEX_INTERNAL_RENDER !== "1"
      ) {
        cleanedBuildOutput = true
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

      await writeMdxTypecheckFiles(root, options)
    },

    resolveId: {
      filter: {
        id: /^(virtual:sitex-islands|virtual:sitex-routes|virtual:sitex-render|sitex:pages)$/,
      },
      handler(id) {
        if (id === virtualHydrationId) return resolvedVirtualHydrationId
        if (id === virtualRoutesId) return resolvedVirtualRoutesId
        if (id === virtualRenderId) return resolvedVirtualRenderId
        if (id === virtualPagesId) return resolvedVirtualPagesId
      },
    },

    load: {
      filter: {
        id: /^(\0virtual:sitex-islands|\0virtual:sitex-routes|\0virtual:sitex-render|\0sitex:pages)$/,
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
          return createJavaScriptModule(createVirtualRenderCode(root))
        }

        if (id === resolvedVirtualPagesId) {
          return createJavaScriptModule(createPagesModuleCode(options))
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

        if (hasContentExport(code)) {
          const file = normalizePath(path.relative(root, id))
          throw new Error(
            `Page module "${file}" exports content. Use "export const data" instead.`
          )
        }

        if (!id.endsWith(".tsx") || !code.includes("client:")) return

        return transformClientDirectives(code, id, root, hydration)
      },
    },

    configureServer(server: ViteDevServer) {
      if (shouldGenerateContentTypes()) {
        void writeContentTypesFromServer(root, server, options).catch(
          (error: unknown) => {
            server.config.logger.error(formatContentTypeError(error))
          }
        )
      }

      server.middlewares.use(async (req, res, next) => {
        if (!isHtmlRequest(req)) {
          next()
          return
        }

        const url = req.url?.split("?")[0] ?? "/"
        const request = createWebRequest(req)

        try {
          const { render } = await importServerModule(server, virtualRenderId)
          const initialHtml = await render(url, { request })

          if (!initialHtml) {
            next()
            return
          }

          const stylesheetHrefs = readRouteStylesheetHrefs(
            server.environments.ssr.moduleGraph,
            root,
            initialHtml.route.file
          )
          const html = await render(url, {
            assetTags: renderStylesheetTags(stylesheetHrefs),
            islandClientPreamble: renderReactRefreshFallbackScript(),
            islandClientSrc: devServerFileUrl("hydration/client", "tsx"),
            request,
          })

          if (!html) {
            next()
            return
          }

          const transformed = await server.transformIndexHtml(url, html.html)

          res.statusCode = 200
          res.setHeader("Content-Type", "text/html")
          res.end(req.method === "HEAD" ? undefined : transformed)
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

        if (!shouldReloadForFile(file)) return

        invalidateVirtualModules(this.environment.moduleGraph, update.timestamp)

        if (
          shouldGenerateContentTypes() &&
          (file.includes("/src/pages/") || file.includes("/src/data/"))
        ) {
          await writeContentTypesFromServer(root, update.server, options)
        }

        if (file.includes("/src/pages/") && file.endsWith(".mdx")) {
          await writeMdxTypecheckFiles(root, options)
        }

        this.environment.hot.send({ type: "full-reload" })
        return []
      },
    },

    async closeBundle() {
      if (config.command !== "build" || wroteStaticHtml) return

      wroteStaticHtml = true
      await writeStaticHtml(root, options)
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
  const clientEntries = writeClientBuildEntriesSync(root)
  const input: Record<string, string> = {
    islandClient: clientEntries.islandClient,
  }

  for (const [file, entry] of clientEntries.styles) {
    const name = file.replace(/^src\//, "").replace(/\.css$/, "")

    input[name] = entry
  }

  return input
}

function writeClientBuildEntriesSync(root: string) {
  const clientRoot = path.join(root, clientBuildDir)
  const styles = new Map<string, string>()

  mkdirSync(clientRoot, { recursive: true })

  const islandClient = path.join(clientRoot, "island-client.ts")
  writeFileSync(islandClient, `import ${JSON.stringify(islandClientInput)}\n`)

  for (const file of collectStyleFilesSync(root)) {
    const entry = path.join(
      clientRoot,
      `${file.replace(/^src\//, "").replace(/\.css$/, "")}.ts`
    )

    mkdirSync(path.dirname(entry), { recursive: true })
    writeFileSync(entry, `import ${JSON.stringify(path.join(root, file))}\n`)
    styles.set(file, entry)
  }

  return { islandClient, styles }
}

async function writeStaticHtml(root: string, options: ResolvedSitexOptions) {
  const publicRoot = await findBuildPublicRoot(root)
  const manifest = await readManifest(publicRoot)
  const islandClientAsset = Object.values(manifest).find(
    (entry) => entry.name === "islandClient"
  )
  const cssAssetMap = createCssAssetMap(root, manifest)

  const previousInternalRender = process.env.SITEX_INTERNAL_RENDER
  process.env.SITEX_INTERNAL_RENDER = "1"

  const server = await createServer({
    configFile: path.join(root, "vite.config.ts"),
    server: { middlewareMode: true },
    appType: "custom",
    mode: "production",
  })

  try {
    if (shouldGenerateContentTypes()) {
      await writeContentTypesFromServer(root, server, options)
    }

    const { getRoutes, injectRouteHtmlAssets, renderMatchedRoute } =
      await importServerModule(server, virtualRenderId)
    const routes = await getRoutes()

    for (const route of routes) {
      if (route.render === "server") continue

      const html = await renderMatchedRoute(route, route.params)

      if (!html) {
        throw new Error(`Sitex could not render route "${route.path}".`)
      }

      const transformed = stripViteClientScript(
        await server.transformIndexHtml(route.path, html)
      )
      const stylesheetAssets = readRouteStylesheetAssets(
        server.environments.ssr.moduleGraph,
        root,
        route.file,
        cssAssetMap
      )
      if (html.includes("data-sitex-island")) {
        stylesheetAssets.push(...readManifestChunkCss(islandClientAsset))
      }
      const finalHtml = injectRouteHtmlAssets(transformed, {
        assetTags: renderStylesheetTags(stylesheetAssets),
        islandClientSrc: islandClientAsset?.file
          ? publicAssetPath(islandClientAsset.file)
          : undefined,
      })

      await writeHtml(publicRoot, route.path, finalHtml, options)
    }
  } finally {
    await server.close()

    if (previousInternalRender === undefined) {
      delete process.env.SITEX_INTERNAL_RENDER
    } else {
      process.env.SITEX_INTERNAL_RENDER = previousInternalRender
    }
  }
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

async function collectRouteFiles(root: string) {
  return fg(["src/pages/**/*.tsx", "src/pages/**/*.mdx"], {
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

function hasServerPagesSync(root: string) {
  return collectServerRouteFilesSync(root).length > 0
}

function collectServerRouteFilesSync(root: string) {
  const files = fg.sync("src/pages/**/*.tsx", {
    cwd: root,
    ignore: ["src/pages/examples/**"],
    onlyFiles: true,
  })

  return files.filter((file) => {
    const code = readFileSync(path.join(root, file), "utf8")

    return /\bexport\s+const\s+render\s*=\s*["']server["']/.test(code)
  })
}

async function collectPageDataRoutes(
  root: string,
  options: ResolvedSitexOptions
) {
  const files = await collectRouteFiles(root)
  const routes: PageDataRoute[] = []

  for (const file of files) {
    if (hasRouteParams(file)) continue

    if (file.endsWith(".mdx")) {
      routes.push({
        file,
        path: routePathToPublicPath(
          staticPageFileToPath(file),
          options.trailingSlash
        ),
      })
      continue
    }

    const code = await readFile(path.join(root, file), "utf8")

    if (hasContentExport(code)) {
      throw new Error(
        `Page module "${file}" exports content. Use "export const data" instead.`
      )
    }

    if (hasDataExport(code)) {
      routes.push({
        file,
        path: routePathToPublicPath(
          staticPageFileToPath(file),
          options.trailingSlash
        ),
      })
    }
  }

  return routes
}

async function collectPageDataFromServer(
  root: string,
  server: ViteDevServer,
  options: ResolvedSitexOptions
) {
  const routes = await collectPageDataRoutes(root, options)
  const pages: PageData[] = []

  for (const route of routes) {
    const module = (await importServerModule(server, `/${route.file}`)) as {
      data?: unknown
    }

    if (module.data !== undefined) {
      const data = readJsonData(module.data, route.file)
      validatePageData(data, route.file)
      pages.push({
        path: route.path,
        ...data,
      })
    }
  }

  return pages
}

async function writeContentTypesFromServer(
  root: string,
  server: ViteDevServer,
  options: ResolvedSitexOptions
) {
  const typesFile = path.join(root, pagesTypesFile)
  const pages = await collectPageDataFromServer(root, server, options)

  await mkdir(path.dirname(typesFile), { recursive: true })
  await writeFileAtomic(typesFile, await createPagesTypesCode(pages))
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
    resolvedVirtualPagesId,
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

async function transformMdxPage(
  code: string,
  id: string,
  root: string,
  options: ResolvedSitexOptions
) {
  const file = normalizePath(path.relative(root, id))
  const { headings, result } = compileMdx(code)
  const { data, layoutFile } = await readMdxPageMetadata(
    root,
    file,
    result.frontmatter,
    headings
  )
  const pagePath = routePathToPublicPath(
    staticPageFileToPath(file),
    options.trailingSlash
  )

  const mdxCode = result.code.replace(
    /export\s+default\s+MDXContent\s*;?\s*$/,
    "const MarkdownContent = MDXContent;"
  )

  if (mdxCode === result.code) {
    throw new Error(
      `Satteri did not emit the expected MDX component for "${file}".`
    )
  }

  return [
    mdxCode,
    ...createMdxComponentImportCode(options.mdx.components),
    `import * as LayoutModule from ${JSON.stringify(`/${normalizePath(path.relative(root, layoutFile))}`)}`,
    `const Layout = LayoutModule.default`,
    `const mdxComponentsDescriptor = Object.getOwnPropertyDescriptor(LayoutModule, "mdxComponents")`,
    `const layoutMdxComponents = mdxComponentsDescriptor?.get ? mdxComponentsDescriptor.get.call(LayoutModule) : mdxComponentsDescriptor?.value`,
    `const mdxComponents = Object.assign({}, configuredMdxComponents, layoutMdxComponents)`,
    `export const data = ${JSON.stringify(data)}`,
    `export default function MdxPage() {`,
    `  const { layout: _layout, path: _path, children: _children, ...props } = data`,
    `  return _jsx(Layout, Object.assign({}, props, { path: ${JSON.stringify(pagePath)}, children: _jsx(MarkdownContent, { components: mdxComponents }) }))`,
    `}`,
  ].join("\n")
}

function createMdxComponentImportCode(components: Record<string, string>) {
  const entries = Object.entries(components)

  return [
    ...entries.map(
      ([, moduleId], index) =>
        `import MdxComponent${index} from ${JSON.stringify(moduleId)}`
    ),
    entries.length === 0
      ? `const configuredMdxComponents = {}`
      : `const configuredMdxComponents = { ${entries
          .map(
            ([name], index) => `${JSON.stringify(name)}: MdxComponent${index}`
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
    ignore: ["src/pages/examples/**"],
    onlyFiles: true,
  })

  await rm(typecheckRoot, { recursive: true, force: true })

  for (const file of files) {
    const code = await readFile(path.join(root, file), "utf8")
    const { headings, result } = compileMdx(code)
    const { data, layoutFile } = await readMdxPageMetadata(
      root,
      file,
      result.frontmatter,
      headings
    )
    const pagePath = routePathToPublicPath(
      staticPageFileToPath(file),
      options.trailingSlash
    )
    const typecheckFile = path.join(typecheckRoot, `${file}.tsx`)

    await mkdir(path.dirname(typecheckFile), { recursive: true })
    await writeFileAtomic(
      typecheckFile,
      createMdxTypecheckCode(typecheckFile, layoutFile, data, pagePath)
    )
  }
}

async function readMdxPageMetadata(
  root: string,
  file: string,
  frontmatter: { kind: string; value: string } | null | undefined,
  headings: MarkdownHeading[] = []
) {
  const frontmatterData = parseMdxFrontmatter(frontmatter, file)

  if (Object.hasOwn(frontmatterData, "headings")) {
    throw new Error(
      `Frontmatter in "${file}" cannot define reserved key "headings".`
    )
  }

  const data: { [key: string]: JsonValue } = {
    ...frontmatterData,
    headings: headings as unknown as JsonValue,
  }
  const layout = data.layout

  if (hasRouteParams(file)) {
    throw new Error(`Dynamic MDX page "${file}" is not supported.`)
  }

  if (typeof layout !== "string" || layout.trim() === "") {
    throw new Error(
      `MDX page "${file}" must define a string "layout" in frontmatter.`
    )
  }

  if (
    layout.startsWith(".") ||
    layout.startsWith("/") ||
    layout.includes("..") ||
    !/^[A-Za-z0-9][A-Za-z0-9_/-]*$/.test(layout)
  ) {
    throw new Error(
      `MDX page "${file}" has unsupported layout "${layout}". Use a name like "blog/post", not a relative path.`
    )
  }

  validatePageData(data, file)

  const layoutFile = normalizePath(
    path.join(root, "src/layouts", `${layout}.tsx`)
  )

  try {
    await access(layoutFile)
  } catch {
    throw new Error(
      `MDX page "${file}" references missing layout "src/layouts/${layout}.tsx".`
    )
  }

  return { data, layoutFile }
}

function createMdxTypecheckCode(
  typecheckFile: string,
  layoutFile: string,
  data: { [key: string]: JsonValue },
  pagePath: string
) {
  const dataEntries = Object.keys(data)
    .filter((key) => key !== "layout" && key !== "path" && key !== "children")
    .map((key) => `  ${JSON.stringify(key)}: data[${JSON.stringify(key)}],`)

  return [
    `import type { ComponentProps } from "react"`,
    `import Layout from ${JSON.stringify(createRelativeImport(typecheckFile, layoutFile))}`,
    ``,
    `const data = ${JSON.stringify(data, null, 2)} as const`,
    `const { layout: _layout, path: _path, children: _children, ..._props } = data as typeof data & { path?: never; children?: never }`,
    `const layoutProps = {`,
    ...dataEntries,
    `  path: ${JSON.stringify(pagePath)},`,
    `} satisfies Omit<ComponentProps<typeof Layout>, "children">`,
    ``,
    `export const typecheck = <Layout {...layoutProps}>{null}</Layout>`,
    ``,
  ].join("\n")
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
    `import { readPageRoutes, sortRoutes, validateUniqueRoutePaths } from ${JSON.stringify(packageFile("router/runtime", "ts"))}`,
    `const routeModules = import.meta.glob(["/src/pages/**/*.tsx", "/src/pages/**/*.mdx"])`,
    `function isRouteFile(file) {`,
    `  return !file.includes("/src/pages/examples/")`,
    `}`,
    `export async function getRoutes() {`,
    `  const routes = []`,
    `  for (const [file, load] of Object.entries(routeModules)) {`,
    `    if (!isRouteFile(file)) continue`,
    `    const routeFile = file.replace(/^\\/+/, "")`,
    `    routes.push(...await readPageRoutes(await load(), routeFile))`,
    `  }`,
    `  validateUniqueRoutePaths(routes)`,
    `  return sortRoutes(routes)`,
    `}`,
  ].join("\n")
}

function createPagesModuleCode(options: ResolvedSitexOptions) {
  const trailingSlash = JSON.stringify(options.trailingSlash)

  return [
    `const pageDataModules = import.meta.glob(["/src/pages/**/*.tsx", "/src/pages/**/*.mdx"], { import: "data" })`,
    `function normalizeRoutePath(path) {`,
    `  if (!path || path === "/") return "/"`,
    `  return "/" + path.replace(/^\\/+|\\/+$/g, "")`,
    `}`,
    `function staticPageFileToPath(file) {`,
    `  const route = file.replace(/^src\\/pages/, "").replace(/\\/index\\.(tsx|mdx)$/, "/").replace(/\\.(tsx|mdx)$/, "")`,
    `  return normalizeRoutePath(route || "/")`,
    `}`,
    `function routePathToPublicPath(path) {`,
    `  if (path === "/") return "/"`,
    `  return ${trailingSlash} ? path.replace(/\\/$/, "") + "/" : path.replace(/\\/$/, "")`,
    `}`,
    `function isRouteFile(file) {`,
    `  return !file.includes("/src/pages/examples/") && !/\\[[^\\]]+\\]/.test(file)`,
    `}`,
    `function validateData(data, file) {`,
    `  if (data && typeof data === "object") {`,
    `    if (Object.hasOwn(data, "path")) throw new Error(\`Page data in "\${file}" cannot define reserved key "path".\`)`,
    `    if (Object.hasOwn(data, "children")) throw new Error(\`Page data in "\${file}" cannot define reserved key "children".\`)`,
    `  }`,
    `}`,
    `const routeMeta = Object.keys(pageDataModules)`,
    `  .filter(isRouteFile)`,
    `  .map((file) => {`,
    `    const routeFile = file.replace(/^\\/+/, "")`,
    `    return { file: routeFile, path: routePathToPublicPath(staticPageFileToPath(routeFile)) }`,
    `  })`,
    `async function toPage(route) {`,
    `  const load = pageDataModules["/" + route.file]`,
    `  if (!load) return undefined`,
    `  const data = await load()`,
    `  if (data === undefined) return undefined`,
    `  validateData(data, route.file)`,
    `  return { path: route.path, ...data }`,
    `}`,
    `export async function getPages(prefix) {`,
    `  const publicPrefix = prefix === undefined ? undefined : routePathToPublicPath(normalizeRoutePath(prefix))`,
    `  const matches = publicPrefix === undefined ? routeMeta : routeMeta.filter((page) => page.path.startsWith(publicPrefix))`,
    `  const pages = await Promise.all(matches.map(toPage))`,
    `  return pages.filter((page) => page !== undefined)`,
    `}`,
    `export async function getPage(path) {`,
    `  const publicPath = routePathToPublicPath(normalizeRoutePath(path))`,
    `  const route = routeMeta.find((page) => page.path === publicPath)`,
    `  return route ? toPage(route) : undefined`,
    `}`,
  ].join("\n")
}

async function createPagesTypesCode(pages: PageData[]) {
  const { InputData, jsonInputForTargetLanguage, quicktype } =
    await import("quicktype-core")
  const jsonInput = jsonInputForTargetLanguage("typescript")

  await jsonInput.addSource({
    name: "Page",
    samples:
      pages.length > 0
        ? pages.map((page) => JSON.stringify(page))
        : [JSON.stringify({ path: "" })],
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
    `declare module "sitex:pages" {`,
    types,
    `  type Pages = Page[]`,
    `  export function getPages(prefix?: string): Promise<Pages>`,
    `  export function getPage(path: string): Promise<Page | undefined>`,
    `}`,
    "",
  ].join("\n")
}

function createVirtualRenderCode(root: string) {
  const serverRouteFiles = collectServerRouteFilesSync(root).map(
    (file) => `/${file}`
  )

  return [
    `import { prerender } from "react-dom/static"`,
    `import { renderToString } from "react-dom/server"`,
    `import { getRoutes } from ${JSON.stringify(virtualRoutesId)}`,
    `import { createPageContext, matchRoute, readPageRoutes } from ${JSON.stringify(packageFile("router/runtime", "ts"))}`,
    `export { getRoutes }`,
    `const serverRouteModules = import.meta.glob(["/src/pages/**/*.tsx", "/src/pages/**/*.mdx"])`,
    `const serverRouteFiles = ${JSON.stringify(serverRouteFiles)}`,
    `function isRouteFile(file) {`,
    `  return !file.includes("/src/pages/examples/")`,
    `}`,
    `function normalizeRoutePath(path) {`,
    `  if (!path || path === "/") return "/"`,
    `  return "/" + path.replace(/^\\/+|\\/+$/g, "")`,
    `}`,
    `function routeFileToPattern(file) {`,
    `  const route = file.replace(/^\\/+/, "").replace(/^src\\/pages/, "").replace(/\\/index\\.(tsx|mdx)$/, "/").replace(/\\.(tsx|mdx)$/, "")`,
    `  return normalizeRoutePath(route || "/")`,
    `}`,
    `function routeScore(path) {`,
    `  return normalizeRoutePath(path).split("/").reduce((score, segment) => score + (!segment ? 0 : segment.startsWith("[") ? 1 : 10), 0)`,
    `}`,
    `function matchPathPattern(pattern, path) {`,
    `  const patternSegments = normalizeRoutePath(pattern).split("/")`,
    `  const pathSegments = normalizeRoutePath(path).split("/")`,
    `  if (patternSegments.length !== pathSegments.length) return undefined`,
    `  const params = {}`,
    `  for (let index = 0; index < patternSegments.length; index++) {`,
    `    const patternSegment = patternSegments[index]`,
    `    const pathSegment = pathSegments[index]`,
    `    const paramMatch = patternSegment.match(/^\\[([^\\]]+)\\]$/)`,
    `    if (paramMatch) {`,
    `      params[paramMatch[1]] = decodeURIComponent(pathSegment)`,
    `      continue`,
    `    }`,
    `    if (patternSegment !== pathSegment) return undefined`,
    `  }`,
    `  return params`,
    `}`,
    `async function matchServerRoute(path) {`,
    `  const candidates = []`,
    `  for (const file of serverRouteFiles) {`,
    `    if (!isRouteFile(file)) continue`,
    `    const pattern = routeFileToPattern(file)`,
    `    const params = matchPathPattern(pattern, path)`,
    `    if (params) candidates.push({ file, params, pattern, score: routeScore(pattern) })`,
    `  }`,
    `  candidates.sort((a, b) => b.score - a.score || a.pattern.localeCompare(b.pattern))`,
    `  const candidate = candidates[0]`,
    `  if (!candidate) return undefined`,
    `  const routeFile = candidate.file.replace(/^\\/+/, "")`,
    `  const loadRoute = serverRouteModules[candidate.file]`,
    `  if (!loadRoute) return undefined`,
    `  const routes = await readPageRoutes(await loadRoute(), routeFile)`,
    `  const match = matchRoute(routes, path)`,
    `  return match ? { params: { ...candidate.params, ...match.params }, route: match.route } : undefined`,
    `}`,
    `function replaceLast(value, search, replacement) {`,
    `  const index = value.lastIndexOf(search)`,
    `  if (index === -1) return value`,
    `  return value.slice(0, index) + replacement + value.slice(index + search.length)`,
    `}`,
    `export function injectRouteHtmlAssets(html, options = {}) {`,
    `  const script = options.islandClientSrc && html.includes("data-sitex-island")`,
    `    ? \`\${options.islandClientPreamble ?? ""}<script src="\${options.islandClientSrc}" type="module"></script>\``,
    `    : ""`,
    `  const headTags = options.assetTags ?? ""`,
    `  let result = html`,
    `  if (headTags) {`,
    `    if (!result.includes("</head>")) {`,
    `      throw new Error("Sitex could not inject build assets because the document shell has no </head>.")`,
    `    }`,
    `    result = result.replace("</head>", headTags + "</head>")`,
    `  }`,
    `  if (script) {`,
    `    if (!result.includes("</body>")) {`,
    `      throw new Error("Sitex could not inject island client assets because the document shell has no </body>.")`,
    `    }`,
    `    result = replaceLast(result, "</body>", script + "</body>")`,
    `  }`,
    `  return result`,
    `}`,
    `function createRenderResult(route, params, html) {`,
    `  return { html, params, route }`,
    `}`,
    `async function renderRouteHtml(route, params, options = {}) {`,
    `  const request = route.render === "server" ? options.request : undefined`,
    `  const context = createPageContext(route, params, request)`,
    `  const node = await route.layout(context)`,
    `  let body`,
    `  if (route.render === "server") {`,
    `    body = renderToString(node)`,
    `  } else {`,
    `    body = await new Response((await prerender(node)).prelude).text()`,
    `  }`,
    `  const html = /^\\s*<!doctype\\s/i.test(body) ? body : "<!doctype html>" + body`,
    `  return injectRouteHtmlAssets(html, options)`,
    `}`,
    `export async function render(url, options = {}) {`,
    `  const routes = await getRoutes()`,
    `  const match = matchRoute(routes, url)`,
    `  if (!match) return undefined`,
    `  const html = await renderRouteHtml(match.route, match.params, options)`,
    `  return createRenderResult(match.route, match.params, html)`,
    `}`,
    `export async function renderMatchedRoute(route, params, options = {}) {`,
    `  return renderRouteHtml(route, params, options)`,
    `}`,
    `export async function renderServerResponse(request, options = {}) {`,
    `  const url = new URL(request.url)`,
    `  const match = await matchServerRoute(url.pathname)`,
    `  if (!match) return undefined`,
    `  const html = await renderRouteHtml(match.route, match.params, { ...options, request })`,
    `  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } })`,
    `}`,
  ].join("\n")
}

function createWebRequest(req: Connect.IncomingMessage) {
  const protocolHeader = req.headers["x-forwarded-proto"]
  const protocol = Array.isArray(protocolHeader)
    ? (protocolHeader[0] ?? "http")
    : (protocolHeader ?? "http")
  const host = req.headers.host ?? "localhost"
  const url = new URL(req.url ?? "/", `${protocol}://${host}`)
  const headers = new Headers()

  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue

    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item)
      continue
    }

    headers.set(key, value)
  }

  return new Request(url, {
    headers,
    method: req.method,
  })
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

function staticPageFileToPath(file: string) {
  const route = file
    .replace(/^src\/pages/, "")
    .replace(/\/index\.(tsx|mdx)$/, "/")
    .replace(/\.(tsx|mdx)$/, "")

  return normalizeRoutePath(route || "/")
}

function hasRouteParams(file: string) {
  return /\[[^\]]+\]/.test(file)
}

function hasContentExport(code: string) {
  return /\bexport\s+const\s+content\b/.test(code)
}

function hasDataExport(code: string) {
  return /\bexport\s+const\s+data\b/.test(code)
}

function readJsonData(
  value: unknown,
  file: string
): { [key: string]: JsonValue } {
  const data = readJsonValue(value, file, "data", new WeakSet<object>())

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`Data export in "${file}" must be a JSON object.`)
  }

  return data
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

function validatePageData(data: { [key: string]: JsonValue }, file: string) {
  for (const key of ["path", "children"]) {
    if (Object.hasOwn(data, key)) {
      throw new Error(
        `Page data in "${file}" cannot define reserved key "${key}".`
      )
    }
  }
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

function normalizeRoutePath(path: string) {
  if (!path || path === "/") return "/"
  return `/${path.replace(/^\/+|\/+$/g, "")}`
}

function routePathToPublicPath(path: string, trailingSlash: boolean) {
  if (path === "/") return "/"

  return trailingSlash ? `${path.replace(/\/$/, "")}/` : path.replace(/\/$/, "")
}

async function findBuildPublicRoot(root: string) {
  for (const publicRoot of [
    path.join(root, "dist"),
    path.join(root, ".output/public"),
  ]) {
    try {
      await access(path.join(publicRoot, ".vite/manifest.json"))
      return publicRoot
    } catch {
      // Try the next build output.
    }
  }

  await mkdir(path.join(root, "dist"), { recursive: true })
  return path.join(root, "dist")
}

async function readManifest(publicRoot: string): Promise<Manifest> {
  const file = path.join(publicRoot, ".vite/manifest.json")
  try {
    return JSON.parse(await readFile(file, "utf8")) as Manifest
  } catch {
    return {}
  }
}

function renderStylesheetTags(hrefs: string[]) {
  return hrefs.map((href) => `<link href="${href}" rel="stylesheet">`).join("")
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
  graph: EnvironmentModuleGraph,
  root: string,
  routeFile: string,
  cssAssetMap: Map<string, string>
) {
  const assets = new Set<string>()

  for (const file of collectRouteCssFiles(graph, root, routeFile)) {
    const asset = cssAssetMap.get(file)

    if (asset) assets.add(asset)
  }

  return [...assets]
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
