declare module "virtual:sitex-islands" {
  import type { ComponentType } from "react"

  export const islands: Record<
    string,
    () => Promise<{ default: ComponentType<Record<string, unknown>> }>
  >
}

declare module "virtual:sitex-routes" {
  import type { Route } from "@fulldotdev/sitex"

  export function getRoutes(): Promise<Route[]>
}

declare module "sitex:pages" {
  import type {
    FaqQuestion,
    JsonValue,
    MarkdownHeading,
    PageType,
  } from "@fulldotdev/sitex"

  type Page = {
    path: string
    layout: string
    title: string
    description: string
    type?: PageType
    image?: string
    canonical?: string
    noindex?: boolean
    publishedAt?: string
    updatedAt?: string
    author?: string
    questions?: FaqQuestion[]
    headings: MarkdownHeading[]
    [key: string]: JsonValue | undefined
  }

  export function getPages(prefix?: string): Promise<Page[]>
  export function getPage(path: string): Promise<Page | undefined>
}

declare module "sitex:globals" {
  export interface Globals {
    readonly [key: string]: unknown
  }

  const globals: Globals
  export const locales: Readonly<Record<string, Globals>>
  export { globals }
  export default globals
}

declare namespace React {
  interface Attributes {
    "client:idle"?: boolean
    "client:load"?: boolean
    "client:media"?: string
    "client:only"?: boolean
    "client:visible"?: boolean
  }
}
