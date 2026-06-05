import { parseAst } from "vite-plus"

import {
  createHydrationEntry,
  registerHydrationEntry,
  type HydrationRegistry,
} from "./registry.ts"
import { type HydrationMode } from "./protocol.ts"

type AstNode = {
  [key: string]: unknown
  end?: number
  start?: number
  type?: string
}

type HydrationEntry = ReturnType<typeof createHydrationEntry>

type ClientDirective = {
  media?: string
  mode: HydrationMode
}

type Replacement = {
  end: number
  start: number
  value: string
}

export function collectHydrationEntries(
  code: string,
  id: string,
  root: string,
  registry: HydrationRegistry
) {
  if (!code.includes("client:")) return

  const ast = parseHydrationSource(code, id)
  const imports = readImports(ast, id, root)

  walkAst(ast, (node) => {
    if (node.type !== "JSXElement") return

    const opening = readObject(node.openingElement)
    const directive = opening ? readClientDirective(opening, code) : undefined

    if (!directive) return

    const name = readElementName(readObject(opening?.name))
    const entry = name ? imports.get(name) : undefined

    if (entry) registerHydrationEntry(registry, entry)
  })
}

export function transformClientDirectives(
  code: string,
  id: string,
  root: string,
  registry: HydrationRegistry
) {
  const ast = parseHydrationSource(code, id)
  const imports = readImports(ast, id, root)
  const replacements: Replacement[] = []

  walkAst(ast, (node) => {
    if (node.type !== "JSXElement") return

    const opening = readObject(node.openingElement)
    const directive = opening ? readClientDirective(opening, code) : undefined

    if (!opening || !directive) return

    const name = readElementName(readObject(opening.name))
    const entry = name ? imports.get(name) : undefined

    if (!name || !entry) {
      throw new Error(
        `Sitex client directive in "${id}" requires an imported component.`
      )
    }

    if (directive.mode === "media" && !directive.media) {
      throw new Error(
        `Sitex client:media in "${id}" requires a string media query, for example client:media="(min-width: 48rem)".`
      )
    }

    registerHydrationEntry(registry, entry)
    addIslandReplacements(
      code,
      node,
      opening,
      name,
      entry,
      directive,
      replacements
    )
  })

  if (replacements.length === 0) return

  return applyReplacements(
    `import { SitexIsland } from "@fulldotdev/sitex/island"\n${code}`,
    replacements.map((replacement) => ({
      ...replacement,
      end: replacement.end + codeImportOffset,
      start: replacement.start + codeImportOffset,
    }))
  )
}

const codeImportOffset =
  'import { SitexIsland } from "@fulldotdev/sitex/island"\n'.length

function parseHydrationSource(code: string, id: string) {
  return parseAst(
    code,
    { lang: "tsx", sourceType: "module" },
    id
  ) as unknown as AstNode
}

function readImports(ast: AstNode, id: string, root: string) {
  const imports = new Map<string, HydrationEntry>()
  const body = readArray(ast.body)

  for (const node of body) {
    if (node.type !== "ImportDeclaration") continue

    const source = readObject(node.source)
    const sourceValue = source?.value

    if (typeof sourceValue !== "string") continue

    for (const specifier of readArray(node.specifiers)) {
      const local = readObject(specifier.local)
      const localName = local?.name

      if (typeof localName !== "string") continue

      if (specifier.type === "ImportDefaultSpecifier") {
        imports.set(
          localName,
          createHydrationEntry(sourceValue, "default", id, root)
        )
        continue
      }

      if (specifier.type !== "ImportSpecifier") continue

      const imported = readObject(specifier.imported)
      const importedName =
        typeof imported?.name === "string"
          ? imported.name
          : typeof imported?.value === "string"
            ? imported.value
            : undefined

      if (!importedName) continue

      imports.set(
        localName,
        createHydrationEntry(sourceValue, importedName, id, root)
      )
    }
  }

  return imports
}

function addIslandReplacements(
  code: string,
  element: AstNode,
  opening: AstNode,
  name: string,
  entry: HydrationEntry,
  directive: ClientDirective,
  replacements: Replacement[]
) {
  const props = createPropsObjectCode(code, readArray(opening.attributes))
  const mediaAttribute = directive.media
    ? ` media={${JSON.stringify(directive.media)}}`
    : ""
  const islandOpening = `<SitexIsland component={${name}} id={${JSON.stringify(entry.id)}}${mediaAttribute} mode={${JSON.stringify(directive.mode)}} props={${props}}>`

  if (opening.selfClosing === true) {
    replacements.push({
      start: readPosition(element.start),
      end: readPosition(element.end),
      value: `${islandOpening}</SitexIsland>`,
    })
    return
  }

  replacements.push({
    start: readPosition(opening.start),
    end: readPosition(opening.end),
    value: islandOpening,
  })

  const closing = readObject(element.closingElement)

  if (closing) {
    replacements.push({
      start: readPosition(closing.start),
      end: readPosition(closing.end),
      value: "</SitexIsland>",
    })
  }
}

function createPropsObjectCode(code: string, attributes: AstNode[]) {
  const properties = attributes
    .filter((attribute) => !isClientDirective(attribute))
    .map((attribute) => jsxAttributeToObjectPropertyCode(code, attribute))

  return `{${properties.join(",")}}`
}

function jsxAttributeToObjectPropertyCode(code: string, attribute: AstNode) {
  if (attribute.type === "JSXSpreadAttribute") {
    const argument = readObject(attribute.argument)

    return `...${sliceNode(code, argument)}`
  }

  if (attribute.type !== "JSXAttribute") {
    throw new Error("Unsupported JSX attribute in Sitex client directive.")
  }

  const name = readObject(attribute.name)

  if (name?.type !== "JSXIdentifier" || typeof name.name !== "string") {
    throw new Error("Sitex client directives only support plain JSX props.")
  }

  const key = propertyKeyCode(name.name)
  const value = readObject(attribute.value)

  if (!value) return `${key}: true`
  if (value.type === "Literal") return `${key}: ${readLiteralCode(value)}`
  if (value.type === "JSXExpressionContainer") {
    return `${key}: ${sliceNode(code, readObject(value.expression))}`
  }

  throw new Error("Unsupported JSX prop value in Sitex client directive.")
}

function readClientDirective(
  opening: AstNode,
  code: string
): ClientDirective | undefined {
  for (const attribute of readArray(opening.attributes)) {
    if (!isClientDirective(attribute)) continue

    const name = readObject(attribute.name)
    const directiveName = readObject(name?.name)?.name

    if (directiveName === "load") return { mode: "load" }
    if (directiveName === "only") return { mode: "only" }
    if (directiveName === "visible") return { mode: "visible" }
    if (directiveName === "idle") return { mode: "idle" }
    if (directiveName === "media") {
      return { media: readClientMedia(attribute, code), mode: "media" }
    }
  }
}

function readClientMedia(attribute: AstNode, code: string) {
  const value = readObject(attribute.value)

  if (!value) return
  if (value.type === "Literal" && typeof value.value === "string")
    return value.value
  if (value.type !== "JSXExpressionContainer") return

  const expression = readObject(value.expression)

  if (expression?.type === "Literal" && typeof expression.value === "string") {
    return expression.value
  }

  if (
    expression?.type === "TemplateLiteral" &&
    readArray(expression.expressions).length === 0
  ) {
    return sliceNode(code, expression).slice(1, -1)
  }
}

function isClientDirective(attribute: AstNode) {
  const name = readObject(attribute.name)

  if (attribute.type !== "JSXAttribute" || name?.type !== "JSXNamespacedName") {
    return false
  }

  return (
    readObject(name.namespace)?.name === "client" &&
    typeof readObject(name.name)?.name === "string"
  )
}

function readElementName(name: AstNode | undefined) {
  return name?.type === "JSXIdentifier" && typeof name.name === "string"
    ? name.name
    : undefined
}

function propertyKeyCode(name: string) {
  return /^[$A-Z_a-z][$\w]*$/.test(name) ? name : JSON.stringify(name)
}

function readLiteralCode(node: AstNode) {
  return typeof node.raw === "string" ? node.raw : JSON.stringify(node.value)
}

function sliceNode(code: string, node: AstNode | undefined) {
  return code.slice(readPosition(node?.start), readPosition(node?.end))
}

function readObject(value: unknown): AstNode | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as AstNode)
    : undefined
}

function readArray(value: unknown): AstNode[] {
  return Array.isArray(value) ? (value.filter(readObject) as AstNode[]) : []
}

function readPosition(value: unknown) {
  if (typeof value !== "number") {
    throw new Error("Sitex received an AST node without source positions.")
  }

  return value
}

function walkAst(node: AstNode, visit: (node: AstNode) => void) {
  visit(node)

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const child = readObject(item)

        if (child) walkAst(child, visit)
      }
      continue
    }

    const child = readObject(value)

    if (child) walkAst(child, visit)
  }
}

function applyReplacements(code: string, replacements: Replacement[]) {
  let result = code

  for (const replacement of [...replacements].sort(
    (a, b) => b.start - a.start
  )) {
    result =
      result.slice(0, replacement.start) +
      replacement.value +
      result.slice(replacement.end)
  }

  return result
}

export { collectHydrationEntries as collectIslands }
