import { readFile } from "node:fs/promises"
import path from "node:path"

import generateModule from "@babel/generator"
import { parse } from "@babel/parser"
import traverseModule from "@babel/traverse"
import * as t from "@babel/types"
import fg from "fast-glob"
import type { Connect, Plugin, ViteDevServer } from "vite"

import { findRoute, getRoutes } from "./routes"

type Island = {
  exportName: string
  id: string
  moduleId: string
}

const generateCode = (
  "default" in generateModule ? generateModule.default : generateModule
) as typeof generateModule
const traverseAst = (
  "default" in traverseModule ? traverseModule.default : traverseModule
) as typeof traverseModule

const virtualIslandsId = "virtual:ostra-islands"
const resolvedVirtualIslandsId = `\0${virtualIslandsId}`
const astroContentId = "astro:content"

const isHtmlRequest = (req: Connect.IncomingMessage) => {
  if (!req.url || (req.method !== "GET" && req.method !== "HEAD")) return false
  if (req.url.includes(".")) return false

  const accept = req.headers.accept ?? ""
  return accept.includes("text/html") || accept.includes("*/*")
}

export function ostra(): Plugin {
  let root = process.cwd()
  const islands = new Map<string, Island>()

  return {
    name: "ostra",
    enforce: "pre",

    configResolved(config) {
      root = config.root
    },

    async buildStart() {
      islands.clear()

      const files = await fg("src/**/*.tsx", {
        cwd: root,
        ignore: ["src/pages/examples/**"],
        onlyFiles: true,
      })

      for (const file of files) {
        const absoluteFile = path.join(root, file)
        const code = await readFile(absoluteFile, "utf8")
        collectIslands(code, absoluteFile, root, islands)
      }
    },

    resolveId(id) {
      if (id === virtualIslandsId) return resolvedVirtualIslandsId
      if (id === astroContentId) return path.join(root, "framework/content.ts")
    },

    load(id) {
      if (id !== resolvedVirtualIslandsId) return

      const entries = Array.from(islands.values()).map((island) => {
        return `${JSON.stringify(island.id)}: () => import(${JSON.stringify(
          island.moduleId
        )}).then((mod) => ({ default: mod[${JSON.stringify(island.exportName)}] }))`
      })

      return `export const islands = {${entries.join(",")}}`
    },

    transform(code, id) {
      if (!id.endsWith(".tsx") || !code.includes("client:")) return

      return transformClientDirectives(code, id, root, islands)
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
            const mod = await server.ssrLoadModule("/framework/render.tsx")
            const html = await mod.renderRoute(route, {
              assets: {
                scripts: ["/framework/island-client.tsx"],
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
      if (
        ctx.file.includes("/src/pages/") ||
        ctx.file.includes("/src/content/") ||
        ctx.file.endsWith("/src/content.config.ts")
      ) {
        ctx.server.ws.send({ type: "full-reload" })
      }
    },
  }
}

function collectIslands(
  code: string,
  id: string,
  root: string,
  islands: Map<string, Island>
) {
  if (!code.includes("client:")) return

  const ast = parse(code, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  })
  const imports = readImports(ast, id, root)

  traverseAst(ast, {
    JSXElement(path) {
      const opening = path.node.openingElement
      const mode = readClientMode(opening)

      if (!mode) return

      const name = readElementName(opening.name)
      const imported = name ? imports.get(name) : undefined

      if (imported) islands.set(imported.id, imported)
    },
  })
}

function transformClientDirectives(
  code: string,
  id: string,
  root: string,
  islands: Map<string, Island>
) {
  const ast = parse(code, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  })
  const imports = readImports(ast, id, root)
  let changed = false

  traverseAst(ast, {
    JSXElement(path) {
      const opening = path.node.openingElement
      const mode = readClientMode(opening)

      if (!mode) return

      const name = readElementName(opening.name)
      const imported = name ? imports.get(name) : undefined

      if (!name || !imported) {
        throw path.buildCodeFrameError(
          "Ostra client directives currently require an imported component."
        )
      }

      islands.set(imported.id, imported)

      const props = t.objectExpression(
        opening.attributes
          .filter((attribute) => !isClientDirective(attribute))
          .map((attribute) => jsxAttributeToObjectProperty(attribute))
      )

      path.replaceWith(
        t.jsxElement(
          t.jsxOpeningElement(
            t.jsxIdentifier("OstraIsland"),
            [
              t.jsxAttribute(t.jsxIdentifier("component"), t.jsxExpressionContainer(t.identifier(name))),
              t.jsxAttribute(t.jsxIdentifier("id"), t.stringLiteral(imported.id)),
              t.jsxAttribute(t.jsxIdentifier("mode"), t.stringLiteral(mode)),
              t.jsxAttribute(t.jsxIdentifier("props"), t.jsxExpressionContainer(props)),
            ],
            false
          ),
          t.jsxClosingElement(t.jsxIdentifier("OstraIsland")),
          path.node.children
        )
      )
      path.skip()
      changed = true
    },
  })

  if (!changed) return

  ast.program.body.unshift(
    t.importDeclaration(
      [t.importSpecifier(t.identifier("OstraIsland"), t.identifier("OstraIsland"))],
      t.stringLiteral("/framework/island")
    )
  )

  return generateCode(ast, {}, code).code
}

function readImports(
  ast: t.File,
  id: string,
  root: string
): Map<string, Island> {
  const imports = new Map<string, Island>()

  for (const node of ast.program.body) {
    if (!t.isImportDeclaration(node)) continue

    for (const specifier of node.specifiers) {
      if (!t.isImportSpecifier(specifier) && !t.isImportDefaultSpecifier(specifier)) {
        continue
      }

      const exportName = t.isImportDefaultSpecifier(specifier)
        ? "default"
        : t.isIdentifier(specifier.imported)
          ? specifier.imported.name
          : specifier.imported.value
      const moduleId = normalizeModuleId(node.source.value, id, root)
      const island = {
        exportName,
        id: `${moduleId}:${exportName}`,
        moduleId,
      }

      imports.set(specifier.local.name, island)
    }
  }

  return imports
}

function normalizeModuleId(source: string, importer: string, root: string) {
  if (path.isAbsolute(source)) {
    return `/${path.relative(root, source).replaceAll(path.sep, "/")}`
  }

  if (!source.startsWith(".")) return source

  const absolute = path.resolve(path.dirname(importer), source)
  const withExtension = path.extname(absolute) ? absolute : `${absolute}.tsx`

  return `/${path.relative(root, withExtension).replaceAll(path.sep, "/")}`
}

function readClientMode(node: t.JSXOpeningElement) {
  for (const attribute of node.attributes) {
    if (!t.isJSXAttribute(attribute) || !t.isJSXNamespacedName(attribute.name)) {
      continue
    }

    if (attribute.name.namespace.name !== "client") continue

    if (attribute.name.name.name === "load") return "load"
    if (attribute.name.name.name === "only") return "only"
  }
}

function isClientDirective(attribute: t.JSXAttribute | t.JSXSpreadAttribute) {
  return (
    t.isJSXAttribute(attribute) &&
    t.isJSXNamespacedName(attribute.name) &&
    attribute.name.namespace.name === "client"
  )
}

function readElementName(name: t.JSXElement["openingElement"]["name"]) {
  return t.isJSXIdentifier(name) ? name.name : undefined
}

function jsxAttributeToObjectProperty(attribute: t.JSXAttribute | t.JSXSpreadAttribute) {
  if (t.isJSXSpreadAttribute(attribute)) {
    return t.spreadElement(attribute.argument)
  }

  if (!t.isJSXIdentifier(attribute.name)) {
    throw new Error("Ostra client directives only support plain JSX props.")
  }

  const key = t.identifier(attribute.name.name)

  if (!attribute.value) return t.objectProperty(key, t.booleanLiteral(true))
  if (t.isStringLiteral(attribute.value)) {
    return t.objectProperty(key, t.stringLiteral(attribute.value.value))
  }
  if (t.isJSXExpressionContainer(attribute.value)) {
    return t.objectProperty(key, attribute.value.expression as t.Expression)
  }

  throw new Error("Unsupported JSX prop value in Ostra client directive.")
}
