import { readFile } from "node:fs/promises"
import path from "node:path"

import fg from "fast-glob"
import matter from "gray-matter"
import type { z } from "zod"

export { z } from "zod"

export type ContentData = object
type ProjectCollections = typeof import("../src/content.config").collections
type CollectionName = Extract<keyof ProjectCollections, string>
type InferCollectionData<Collection extends string> =
  Collection extends CollectionName
    ? ProjectCollections[Collection] extends CollectionConfig<infer Schema>
      ? z.infer<Schema>
      : ContentData
    : ContentData

export type CollectionEntry<
  Collection extends string = string,
  Data extends ContentData = ContentData,
> = {
  id: string
  collection: Collection
  data: Data
  body?: string
  slug?: string
}

export type CollectionEntryReference<Collection extends string = string> = {
  collection: Collection
  id: string
}

export type CollectionConfig<Schema extends z.ZodType = z.ZodType> = {
  type?: "content" | "data"
  schema?: Schema
}

export type ContentConfig = {
  collections: Record<string, CollectionConfig>
}

export type GetCollectionFilter<
  Collection extends string = string,
  Data extends ContentData = ContentData,
> = (entry: CollectionEntry<Collection, Data>) => boolean

const contentDir = "src/content"
const contentConfigModuleId = "/src/content.config.ts"
const entryExtensions = ["md", "mdx", "mdoc", "json", "yaml", "yml"]

export async function getCollection<
  Collection extends string,
  Data extends ContentData = InferCollectionData<Collection>,
>(
  collection: Collection,
  filter?: GetCollectionFilter<Collection, Data>
): Promise<CollectionEntry<Collection, Data>[]> {
  const collectionConfig = await getCollectionConfig(collection)
  const files = await fg(`${contentDir}/${collection}/**/*.{${entryExtensions.join(",")}}`, {
    onlyFiles: true,
  })

  const entries = await Promise.all(
    files.map((file) =>
      readCollectionEntry<Collection, Data>(collection, file, collectionConfig)
    )
  )

  return filter ? entries.filter(filter) : entries
}

export async function getEntry<
  Collection extends string,
  Data extends ContentData = InferCollectionData<Collection>,
>(
  reference: CollectionEntryReference<Collection>
): Promise<CollectionEntry<Collection, Data> | undefined>

export async function getEntry<
  Collection extends string,
  Data extends ContentData = InferCollectionData<Collection>,
>(
  collection: Collection,
  id: string
): Promise<CollectionEntry<Collection, Data> | undefined>

export async function getEntry<
  Collection extends string,
  Data extends ContentData = InferCollectionData<Collection>,
>(
  collectionOrReference: Collection | CollectionEntryReference<Collection>,
  maybeId?: string
): Promise<CollectionEntry<Collection, Data> | undefined> {
  const collection =
    typeof collectionOrReference === "string"
      ? collectionOrReference
      : collectionOrReference.collection
  const id =
    typeof collectionOrReference === "string" ? maybeId : collectionOrReference.id

  if (!id) return undefined

  const entries = await getCollection<Collection, Data>(collection)
  return entries.find((entry) => entry.id === id)
}

async function readCollectionEntry<
  Collection extends string,
  Data extends ContentData,
>(
  collection: Collection,
  file: string,
  collectionConfig: CollectionConfig | undefined
): Promise<CollectionEntry<Collection, Data>> {
  const extension = path.extname(file).slice(1)
  const id = getEntryId(collection, file)
  const source = await readFile(file, "utf8")

  if (isMarkdown(extension)) {
    const parsed = matter(source)
    const data = parseEntryData(collection, id, parsed.data, collectionConfig) as Data
    const slug = "slug" in data && typeof data.slug === "string" ? data.slug : id

    return {
      id,
      collection,
      data,
      body: parsed.content,
      slug,
    }
  }

  return {
    id,
    collection,
    data: parseEntryData(
      collection,
      id,
      parseDataFile(file, source),
      collectionConfig
    ) as Data,
  }
}

export function defineCollection<Schema extends z.ZodType>(
  config: CollectionConfig<Schema>
): CollectionConfig<Schema> {
  return config
}

export function defineContentConfig<const Config extends ContentConfig>(
  config: Config
): Config {
  return config
}

async function getCollectionConfig(collection: string) {
  const contentConfig = await readContentConfig()
  return contentConfig.collections[collection]
}

async function readContentConfig(): Promise<ContentConfig> {
  try {
    const module = (await import(/* @vite-ignore */ contentConfigModuleId)) as {
      default?: ContentConfig
      collections?: ContentConfig["collections"]
    }

    if (module.default) return module.default
    if (module.collections) return { collections: module.collections }
  } catch (error) {
    if (!isMissingContentConfigError(error)) throw error
  }

  return { collections: {} }
}

function parseEntryData(
  collection: string,
  id: string,
  data: ContentData,
  collectionConfig: CollectionConfig | undefined
) {
  const schema = collectionConfig?.schema
  if (!schema) return data

  const result = schema.safeParse(data)

  if (!result.success) {
    throw new Error(
      `Entry "${id}" in collection "${collection}" does not match its schema:\n${result.error.message}`
    )
  }

  return result.data
}

function isMissingContentConfigError(error: unknown) {
  if (!(error instanceof Error)) return false

  return (
    error.message.includes("/src/content.config.ts") ||
    error.message.includes("src/content.config")
  )
}

function parseDataFile(file: string, source: string) {
  const extension = path.extname(file)

  if (extension === ".json") {
    return JSON.parse(source) as ContentData
  }

  return matter(`---\n${source}\n---`).data as ContentData
}

function getEntryId(collection: string, file: string) {
  const collectionRoot = `${contentDir}/${collection}/`

  return file
    .replace(collectionRoot, "")
    .replace(/\.[^.]+$/, "")
    .split(path.sep)
    .join("/")
}

function isMarkdown(extension: string) {
  return extension === "md" || extension === "mdx" || extension === "mdoc"
}
