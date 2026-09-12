import { normalizePath } from "vite-plus"

import { randomUUID } from "node:crypto"
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import path from "node:path"

import fg from "fast-glob"

import {
  pageFileToRoutePath,
  resolveRouteLocale,
  routePathToPublicPath,
  type JsonValue,
} from "../router/runtime.ts"
import { compileMdxCached, createPageUrl, readMdxPageMetadata } from "./mdx.ts"
import type { ResolvedSitexOptions } from "./options.ts"
import { mdxTypecheckDir } from "./paths.ts"

export async function writeMdxTypecheckFiles(
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

function createRelativeImport(fromFile: string, toFile: string) {
  const specifier = normalizePath(path.relative(path.dirname(fromFile), toFile))

  return specifier.startsWith(".") ? specifier : `./${specifier}`
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

async function writeFileAtomic(file: string, content: string) {
  const temporaryFile = `${file}.${process.pid}.${randomUUID()}.tmp`

  await writeFile(temporaryFile, content)
  await rename(temporaryFile, file)
}
