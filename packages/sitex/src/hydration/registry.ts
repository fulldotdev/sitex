import path from "node:path"

export type HydrationEntry = {
  exportName: string
  id: string
  moduleId: string
}

export type HydrationRegistry = Map<string, HydrationEntry>

export const virtualHydrationId = "virtual:sitex-islands"
export const resolvedVirtualHydrationId = `\0${virtualHydrationId}`

export function createHydrationEntry(
  source: string,
  exportName: string,
  importer: string,
  root: string
): HydrationEntry {
  const moduleId = normalizeModuleId(source, importer, root)

  return {
    exportName,
    id: `${moduleId}:${exportName}`,
    moduleId,
  }
}

export function registerHydrationEntry(
  registry: HydrationRegistry,
  entry: HydrationEntry
) {
  registry.set(entry.id, entry)
}

export function createVirtualHydrationCode(entries: Iterable<HydrationEntry>) {
  const virtualEntries = Array.from(entries).map((entry) => {
    return `${JSON.stringify(entry.id)}: () => import(${JSON.stringify(
      entry.moduleId
    )}).then((mod) => ({ default: mod[${JSON.stringify(entry.exportName)}] }))`
  })

  return `export const islands = {${virtualEntries.join(",")}}`
}

function normalizeModuleId(source: string, importer: string, root: string) {
  if (path.isAbsolute(source)) {
    return `/${path.relative(root, source).replaceAll(path.sep, "/")}`
  }

  if (source.startsWith("@/")) {
    return `/src/${source.slice(2)}`
  }

  if (!source.startsWith(".")) return source

  const absolute = path.resolve(path.dirname(importer), source)
  const withExtension = path.extname(absolute) ? absolute : `${absolute}.tsx`

  return `/${path.relative(root, withExtension).replaceAll(path.sep, "/")}`
}

export {
  createHydrationEntry as createIsland,
  createVirtualHydrationCode as createVirtualIslandsCode,
  registerHydrationEntry as registerIsland,
  resolvedVirtualHydrationId as resolvedVirtualIslandsId,
  virtualHydrationId as virtualIslandsId,
  type HydrationEntry as Island,
  type HydrationRegistry as IslandRegistry,
}
