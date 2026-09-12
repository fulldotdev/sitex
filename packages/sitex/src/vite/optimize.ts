import { readFileSync } from "node:fs"
import path from "node:path"

import fg from "fast-glob"

import { collectHydrationEntries } from "../hydration/compiler.ts"
import type { HydrationRegistry } from "../hydration/registry.ts"

/**
 * Island components are the only app code the browser loads, and Vite only
 * discovers their dependencies when a page first requests them. Without
 * entries, the dev server optimizes those dependencies mid-load and reloads
 * the page, which briefly runs two React copies. Handing Vite the island
 * files up front moves that discovery to server start.
 */
export function collectIslandEntryPatterns(root: string) {
  const registry: HydrationRegistry = new Map()

  for (const file of fg.sync("src/**/*.tsx", { cwd: root, onlyFiles: true })) {
    const absoluteFile = path.join(root, file)

    collectHydrationEntries(
      readFileSync(absoluteFile, "utf8"),
      absoluteFile,
      root,
      registry
    )
  }

  const patterns = new Set<string>()

  for (const entry of registry.values()) {
    // Bare specifiers are npm packages; Vite optimizes those on its own.
    if (!entry.moduleId.startsWith("/")) continue

    const relative = entry.moduleId.slice(1)

    patterns.add(path.extname(relative) ? relative : `${relative}.{ts,tsx}`)
  }

  return [...patterns]
}
