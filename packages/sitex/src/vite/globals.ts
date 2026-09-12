import { normalizePath } from "vite-plus"

import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

import fg from "fast-glob"
import { parse as parseYaml } from "yaml"

import type { JsonValue } from "../router/runtime.ts"
import { readJsonData } from "./data.ts"
import type { ResolvedSitexOptions } from "./options.ts"
import { globalsDir } from "./paths.ts"

export function writeGlobalsTypes(root: string, options: ResolvedSitexOptions) {
  const globals = readGlobalsData(root, options)
  const typeFile = path.join(root, ".sitex/globals.d.ts")

  mkdirSync(path.dirname(typeFile), { recursive: true })
  writeFileSync(typeFile, createGlobalsTypesCode(globals, options.locales))
}

export function createGlobalsModuleCode(
  root: string,
  options: ResolvedSitexOptions
) {
  const globals = readGlobalsData(root, options)
  const locales: { [key: string]: JsonValue } = {}

  for (const locale of options.locales) {
    locales[locale] = readGlobalsData(root, options, locale)
  }

  return [
    `export const globals = ${JSON.stringify(globals)}`,
    `export const locales = ${JSON.stringify(locales)}`,
    `export default globals`,
    "",
  ].join("\n")
}

export function readGlobalsData(
  root: string,
  options: ResolvedSitexOptions,
  locale?: string
) {
  const file = resolveGlobalsFile(root, options, locale)
  let source: string

  try {
    source = readFileSync(file, "utf8")
  } catch {
    throw new Error(
      locale
        ? `Sitex requires ${globalsDir}/${locale}.yaml for the "${locale}" locale.`
        : `Sitex requires ${globalsDir}/index.yaml. Create it for global layout content.`
    )
  }

  return parseGlobalsYaml(source, normalizePath(path.relative(root, file)))
}

export function readGlobalsNameSync(
  root: string,
  options: ResolvedSitexOptions
) {
  try {
    const globals = readGlobalsData(root, options)
    const name = globals.name

    return typeof name === "string" && name.trim() ? name : undefined
  } catch {
    return undefined
  }
}

export function resolveGlobalsFile(
  root: string,
  options: ResolvedSitexOptions,
  locale?: string
) {
  const names = locale ? [locale] : ["index", options.site.locale]

  for (const name of names) {
    for (const extension of ["yaml", "yml"]) {
      const file = path.join(root, globalsDir, `${name}.${extension}`)

      if (readFileSyncSafe(file)) return file
    }
  }

  return path.join(root, globalsDir, `${names[0]}.yaml`)
}

/**
 * Globals filenames define the site locales: index.yaml serves the root
 * locale (named by site.locale) and every other file, like en.yaml, serves
 * routes under its /{locale} prefix. A single named file without index.yaml
 * serves the root and sets the locale name.
 */
export function applyGlobalsLocales(
  root: string,
  options: ResolvedSitexOptions
) {
  const files = fg.sync(["*.yaml", "*.yml"], {
    cwd: path.join(root, globalsDir),
    onlyFiles: true,
  })
  const names = [
    ...new Set(files.map((file) => file.replace(/\.ya?ml$/, ""))),
  ].sort()

  if (names.includes("index")) {
    options.locales = names.filter((name) => name !== "index")
    return
  }

  const [only] = names

  if (names.length === 1 && only) {
    options.site.locale = only
    options.locales = []
    return
  }

  if (names.length === 0) {
    options.locales = []
    return
  }

  throw new Error(
    `Sitex found multiple globals files in ${globalsDir} without an index file. Add ${globalsDir}/index.yaml for the root locale; every other file like en.yaml serves /en routes.`
  )
}

function parseGlobalsYaml(source: string, file: string) {
  const value = parseYaml(source)

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Globals in "${file}" must be a YAML object.`)
  }

  return readJsonData(value, file)
}

function createGlobalsTypesCode(
  globals: { [key: string]: JsonValue },
  localeNames: readonly string[]
) {
  const localesKey =
    localeNames.length === 0
      ? "never"
      : localeNames.map((name) => JSON.stringify(name)).join(" | ")

  return [
    `declare module "sitex:globals" {`,
    `  export interface Globals ${createJsonType(globals)}`,
    `  const globals: Globals`,
    `  export const locales: Readonly<Record<${localesKey}, Globals>>`,
    `  export { globals }`,
    `  export default globals`,
    `}`,
    "",
  ].join("\n")
}

function createJsonType(value: JsonValue): string {
  if (typeof value === "string") return JSON.stringify(value)
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }
  if (value === null) return "null"

  if (Array.isArray(value)) {
    return `readonly [${value.map(createJsonType).join(", ")}]`
  }

  const entries = Object.entries(value).map(([key, item]) => {
    return `readonly ${JSON.stringify(key)}: ${createJsonType(item)}`
  })

  return `{ ${entries.join("; ")} }`
}

export function isGlobalsFile(file: string) {
  return (
    file.startsWith(`${globalsDir}/`) &&
    (file.endsWith(".yaml") || file.endsWith(".yml"))
  )
}

export function readFileSyncSafe(file: string) {
  try {
    readFileSync(file)
    return true
  } catch {
    return false
  }
}
