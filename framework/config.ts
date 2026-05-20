import type { ReactNode } from "react"
import type { z } from "zod"

export type OstraOutputMode = "static" | "server" | "none"
export type OstraClientMode = "load" | "none"

export type PageTypeConfig<Schema extends z.ZodType> = {
  schema: Schema
  layout: (props: any) => ReactNode
  output?: OstraOutputMode
  client?: OstraClientMode
}

export type OstraConfig<
  GlobalSchema extends z.ZodType,
  PageTypes extends Record<string, PageTypeConfig<z.ZodType>>,
> = {
  globals: {
    schema: GlobalSchema
  }
  shell: {
    layout: (props: any) => ReactNode
    client?: OstraClientMode
  }
  pages: {
    schema: z.ZodType
    output?: OstraOutputMode
    client?: OstraClientMode
    types: PageTypes
  }
}
