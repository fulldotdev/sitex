import type {
  EnvironmentModuleGraph,
  EnvironmentModuleNode,
  Manifest,
} from "vite-plus"
import { normalizePath } from "vite-plus"

import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"

import fg from "fast-glob"

import { readFileSyncSafe } from "./globals.ts"
import type { BuildOutputChunk } from "./output.ts"
import {
  clientBuildDir,
  devServerFilePath,
  islandClientInput,
  prefetchClientInput,
  publicAssetPath,
} from "./paths.ts"

export function createBuildInput(root: string, prefetch: boolean) {
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

function collectStyleFilesSync(root: string) {
  return fg.sync("src/**/*.css", {
    cwd: root,
    onlyFiles: true,
  })
}

export function readRouteStylesheetHrefs(
  graph: EnvironmentModuleGraph,
  root: string,
  routeFile: string
) {
  return collectRouteCssFiles(graph, root, routeFile).map(devServerFilePath)
}

export function readRouteStylesheetAssets(
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

export function createCssAssetMap(root: string, manifest: Manifest) {
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

function normalizeManifestSourceFile(root: string, source: string) {
  const cleanSource = normalizePath(source.split("?")[0] ?? "")

  if (path.isAbsolute(cleanSource)) return cleanSource
  if (cleanSource.startsWith("/")) {
    return normalizePath(path.join(root, cleanSource.slice(1)))
  }

  return normalizePath(path.join(root, cleanSource))
}

export function readManifestChunkCss(entry: Manifest[string] | undefined) {
  if (!entry) return []

  const assets = new Set<string>()

  if (entry.file.endsWith(".css")) assets.add(publicAssetPath(entry.file))

  for (const cssFile of entry.css ?? []) {
    assets.add(publicAssetPath(cssFile))
  }

  return [...assets]
}
