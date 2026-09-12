import { normalizePath } from "vite-plus"

import { readFile } from "node:fs/promises"
import path from "node:path"

import { defineHastPlugin, mdxToJs } from "satteri"
import { parse as parseYaml } from "yaml"

import { validatePageFrontmatter } from "../router/frontmatter.ts"
import {
  pageFileToRoutePath,
  resolveRouteLocale,
  routePathToPublicPath,
  type JsonValue,
  type MarkdownHeading,
} from "../router/runtime.ts"
import { readJsonData } from "./data.ts"
import type { ResolvedSitexOptions } from "./options.ts"

export function isTsxPageFile(file: string) {
  return file.startsWith("src/pages/") && file.endsWith(".tsx")
}

export function createTsxPageError(file: string) {
  return `Sitex pages are MDX files. Found TSX file "${file}" in src/pages. Move the page markup into a layout in src/layouts and create an MDX page that selects it with "layout" frontmatter.`
}

export async function transformMdxPage(
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

export async function readMdxPageMetadata(
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

const mdxCompileCache = new Map<
  string,
  { source: string; compiled: ReturnType<typeof compileMdx> }
>()

export function compileMdxCached(root: string, file: string, code: string) {
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

export function createPageUrl(siteUrl: string, pagePath: string) {
  return new URL(pagePath, siteUrl).href
}
