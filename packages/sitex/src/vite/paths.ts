import { normalizePath } from "vite-plus"

import path from "node:path"
import { fileURLToPath } from "node:url"

const packageRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

const packageSourceExtension = path.extname(fileURLToPath(import.meta.url))

export const islandClientInput = normalizePath(
  packageFile("hydration/client", "tsx")
)

export const prefetchClientInput = normalizePath(
  packageFile("prefetch/client", "ts")
)

export const clientBuildDir = ".sitex/client"

export const mdxTypecheckDir = ".sitex/typecheck"

export const ssrBuildDir = ".sitex/ssr"

export const globalsDir = "src/globals"

export function packageFile(file: string, sourceExtension: "ts" | "tsx") {
  const extension = packageSourceExtension === ".js" ? "js" : sourceExtension

  return path.join(packageRoot, `${file}.${extension}`)
}

export function devServerFileUrl(file: string, sourceExtension: "ts" | "tsx") {
  return `/@fs/${packageFile(file, sourceExtension).replaceAll(path.sep, "/")}`
}

export function devServerFilePath(file: string) {
  return `/@fs/${file.replaceAll(path.sep, "/")}`
}

export function publicAssetPath(file: string) {
  return `/${file.replace(/^\/+/, "")}`
}
