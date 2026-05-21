import type { ReactNode } from "react"
import type { z } from "zod"

export type PageEntry = Record<string, unknown>
export type PageLayout<Props extends PageEntry = PageEntry> = (
  props: Props
) => ReactNode | Promise<ReactNode>

export type DefinePagesConfig<Entries extends readonly PageEntry[]> = {
  entries: Entries
  layout: PageLayout<Entries[number]>
}

export type DefinePagesWithSchemaConfig<
  Schema extends z.ZodType<PageEntry>,
  Entries extends readonly z.infer<Schema>[],
> = {
  schema: Schema
  entries: Entries
  layout: PageLayout<Entries[number]>
}

export type DefinedPages = {
  schema?: z.ZodType<PageEntry>
  entries: readonly PageEntry[]
  layout: PageLayout
}

export function definePages<const Entries extends readonly PageEntry[]>(
  config: DefinePagesConfig<Entries>
): DefinePagesConfig<Entries>

export function definePages<
  Schema extends z.ZodType<PageEntry>,
  const Entries extends readonly z.infer<Schema>[],
>(
  config: DefinePagesWithSchemaConfig<Schema, Entries>
): DefinePagesWithSchemaConfig<Schema, Entries>

export function definePages(config: DefinedPages) {
  return config
}
