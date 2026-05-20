import { readFileSync } from "node:fs"

import type { Connect, Plugin, ViteDevServer } from "vite"
import type { z } from "zod"

import type { OstraConfig } from "./config"
import { findRoute, getRoutes } from "./routes"

const virtualLayoutsModuleId = "virtual:ostra-layouts"
const resolvedVirtualLayoutsModuleId = `\0${virtualLayoutsModuleId}`
const virtualShellModuleId = "virtual:ostra-shell"
const resolvedVirtualShellModuleId = `\0${virtualShellModuleId}`

export type OstraPlugin<
  GlobalSchema extends z.ZodType,
  PageTypes extends Record<string, { schema: z.ZodType; layout: any }>,
> = Plugin & {
  ostraConfig: OstraConfig<GlobalSchema, PageTypes>
}

const isHtmlRequest = (req: Connect.IncomingMessage) => {
  if (!req.url || (req.method !== "GET" && req.method !== "HEAD")) return false
  if (req.url.includes(".")) return false

  const accept = req.headers.accept ?? ""
  return accept.includes("text/html") || accept.includes("*/*")
}

export function ostra<
  GlobalSchema extends z.ZodType,
  PageTypes extends Record<string, { schema: z.ZodType; layout: any }>,
>(
  config: OstraConfig<GlobalSchema, PageTypes>
): OstraPlugin<GlobalSchema, PageTypes> {
  return {
    name: "ostra",
    ostraConfig: config,

    resolveId(id) {
      if (id === virtualLayoutsModuleId) {
        return resolvedVirtualLayoutsModuleId
      }

      if (id === virtualShellModuleId) {
        return resolvedVirtualShellModuleId
      }
    },

    load(id) {
      if (id === resolvedVirtualLayoutsModuleId) {
        return createClientLayoutsModule(config)
      }

      if (id === resolvedVirtualShellModuleId) {
        return createClientShellModule(config)
      }
    },

    configureServer(server: ViteDevServer) {
      return () => {
        server.middlewares.use(async (req, res, next) => {
          if (!isHtmlRequest(req)) {
            next()
            return
          }

          const url = req.url?.split("?")[0] ?? "/"
          const routes = await getRoutes()
          const route = findRoute(routes, url)

          if (!route) {
            next()
            return
          }

          try {
            const mod = await server.ssrLoadModule("/framework/render.tsx")
            const html = await mod.renderRoute(route, {
              assets: {
                appScripts: ["/framework/app-client.tsx"],
                pageScripts: ["/framework/page-client.tsx"],
                shellScripts: ["/framework/shell-client.tsx"],
                styles: ["/framework/styles.css"],
              },
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

    handleHotUpdate(ctx) {
      if (ctx.file.includes("/src/content/")) {
        ctx.server.ws.send({ type: "full-reload" })
      }
    },
  } as OstraPlugin<GlobalSchema, PageTypes>
}

function createClientShellModule<
  GlobalSchema extends z.ZodType,
  PageTypes extends Record<string, { schema: z.ZodType; layout: any }>,
>(config: OstraConfig<GlobalSchema, PageTypes>) {
  const imports = readViteConfigImports()
  const shellName = config.shell.layout.name
  const importPath = imports.get(shellName)

  if (!importPath) {
    throw new Error(
      `Ostra could not find an import for shell layout "${shellName}" in vite.config.ts.`
    )
  }

  return [
    `import __ostraShell from ${JSON.stringify(importPath)};`,
    "export const shell = __ostraShell;",
  ].join("\n")
}

function createClientLayoutsModule<
  GlobalSchema extends z.ZodType,
  PageTypes extends Record<string, { schema: z.ZodType; layout: any }>,
>(config: OstraConfig<GlobalSchema, PageTypes>) {
  const imports = readViteConfigImports()
  const layoutEntries = Object.entries(config.pages.types).map(
    ([name, pageType], index) => {
      const layoutName = pageType.layout.name
      const importPath = imports.get(layoutName)

      if (!importPath) {
        throw new Error(
          `Ostra could not find an import for layout "${layoutName}" in vite.config.ts.`
        )
      }

      return {
        name,
        importName: `__ostraLayout${index}`,
        importPath,
      }
    }
  )

  return [
    ...layoutEntries.map(
      (entry) => `import ${entry.importName} from ${JSON.stringify(entry.importPath)};`
    ),
    "export const layouts = {",
    ...layoutEntries.map(
      (entry) => `  ${JSON.stringify(entry.name)}: ${entry.importName},`
    ),
    "};",
  ].join("\n")
}

function readViteConfigImports() {
  const source = readFileSync("vite.config.ts", "utf8")
  const imports = new Map<string, string>()
  const importPattern = /^import\s+(.+?)\s+from\s+["'](.+)["'];$/gm

  for (const match of source.matchAll(importPattern)) {
    const clause = match[1]?.trim()
    const sourcePath = match[2]

    if (!clause || !sourcePath?.startsWith("./src/")) continue

    const importPath = sourcePath.replace(/^\./, "")
    const defaultImport = clause.match(/^([A-Za-z_$][\w$]*)/)

    if (defaultImport) {
      imports.set(defaultImport[1], importPath)
    }

    const namedImportBlock = clause.match(/\{([^}]+)\}/)

    if (namedImportBlock) {
      for (const namedImport of namedImportBlock[1].split(",")) {
        const [imported, local = imported] = namedImport
          .trim()
          .split(/\s+as\s+/)
        imports.set(local.trim(), importPath)
      }
    }
  }

  return imports
}
