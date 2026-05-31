import generateModule from "@babel/generator"
import { parse } from "@babel/parser"
import traverseModule from "@babel/traverse"
import * as t from "@babel/types"

import {
  createHydrationEntry,
  registerHydrationEntry,
  type HydrationRegistry,
} from "./registry.ts"

const generateCode = (
  "default" in generateModule ? generateModule.default : generateModule
) as typeof generateModule
const traverseAst = (
  "default" in traverseModule ? traverseModule.default : traverseModule
) as typeof traverseModule

export function collectHydrationEntries(
  code: string,
  id: string,
  root: string,
  registry: HydrationRegistry
) {
  if (!code.includes("client:")) return

  const ast = parseHydrationSource(code)
  const imports = readImports(ast, id, root)

  traverseAst(ast, {
    JSXElement(elementPath) {
      const opening = elementPath.node.openingElement
      const mode = readClientMode(opening)

      if (!mode) return

      const name = readElementName(opening.name)
      const entry = name ? imports.get(name) : undefined

      if (entry) registerHydrationEntry(registry, entry)
    },
  })
}

export function transformClientDirectives(
  code: string,
  id: string,
  root: string,
  registry: HydrationRegistry
) {
  const ast = parseHydrationSource(code)
  const imports = readImports(ast, id, root)
  let changed = false

  traverseAst(ast, {
    JSXElement: {
      exit(elementPath) {
        const opening = elementPath.node.openingElement
        const mode = readClientMode(opening)

        if (!mode) return

        const name = readElementName(opening.name)
        const entry = name ? imports.get(name) : undefined

        if (!name || !entry) {
          throw elementPath.buildCodeFrameError(
            "Sitex client directives currently require an imported component."
          )
        }

        registerHydrationEntry(registry, entry)

        const props = t.objectExpression(
          opening.attributes
            .filter(
              (attribute: t.JSXAttribute | t.JSXSpreadAttribute) =>
                !isClientDirective(attribute)
            )
            .map((attribute: t.JSXAttribute | t.JSXSpreadAttribute) =>
              jsxAttributeToObjectProperty(attribute)
            )
        )

        elementPath.replaceWith(
          t.jsxElement(
            t.jsxOpeningElement(
              t.jsxIdentifier("SitexIsland"),
              [
                t.jsxAttribute(
                  t.jsxIdentifier("component"),
                  t.jsxExpressionContainer(t.identifier(name))
                ),
                t.jsxAttribute(
                  t.jsxIdentifier("id"),
                  t.stringLiteral(entry.id)
                ),
                t.jsxAttribute(t.jsxIdentifier("mode"), t.stringLiteral(mode)),
                t.jsxAttribute(
                  t.jsxIdentifier("props"),
                  t.jsxExpressionContainer(props)
                ),
              ],
              false
            ),
            t.jsxClosingElement(t.jsxIdentifier("SitexIsland")),
            elementPath.node.children
          )
        )
        changed = true
      },
    },
  })

  if (!changed) return

  ast.program.body.unshift(
    t.importDeclaration(
      [
        t.importSpecifier(
          t.identifier("SitexIsland"),
          t.identifier("SitexIsland")
        ),
      ],
      t.stringLiteral("sitex/island")
    )
  )

  return generateCode(ast, {}, code).code
}

function parseHydrationSource(code: string) {
  return parse(code, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  })
}

function readImports(
  ast: t.File,
  id: string,
  root: string
): Map<string, ReturnType<typeof createHydrationEntry>> {
  const imports = new Map<string, ReturnType<typeof createHydrationEntry>>()

  for (const node of ast.program.body) {
    if (!t.isImportDeclaration(node)) continue

    for (const specifier of node.specifiers) {
      if (
        !t.isImportSpecifier(specifier) &&
        !t.isImportDefaultSpecifier(specifier)
      ) {
        continue
      }

      const exportName = t.isImportDefaultSpecifier(specifier)
        ? "default"
        : t.isIdentifier(specifier.imported)
          ? specifier.imported.name
          : specifier.imported.value

      imports.set(
        specifier.local.name,
        createHydrationEntry(node.source.value, exportName, id, root)
      )
    }
  }

  return imports
}

function readClientMode(node: t.JSXOpeningElement) {
  for (const attribute of node.attributes) {
    if (
      !t.isJSXAttribute(attribute) ||
      !t.isJSXNamespacedName(attribute.name)
    ) {
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

function jsxAttributeToObjectProperty(
  attribute: t.JSXAttribute | t.JSXSpreadAttribute
) {
  if (t.isJSXSpreadAttribute(attribute)) {
    return t.spreadElement(attribute.argument)
  }

  if (!t.isJSXIdentifier(attribute.name)) {
    throw new Error("Sitex client directives only support plain JSX props.")
  }

  const key = t.identifier(attribute.name.name)

  if (!attribute.value) return t.objectProperty(key, t.booleanLiteral(true))
  if (t.isStringLiteral(attribute.value)) {
    return t.objectProperty(key, t.stringLiteral(attribute.value.value))
  }
  if (t.isJSXExpressionContainer(attribute.value)) {
    return t.objectProperty(key, attribute.value.expression as t.Expression)
  }

  throw new Error("Unsupported JSX prop value in Sitex client directive.")
}

export { collectHydrationEntries as collectIslands }
