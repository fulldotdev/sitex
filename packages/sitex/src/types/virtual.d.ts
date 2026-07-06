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

declare module "virtual:sitex-render" {
  import type { Route } from "@fulldotdev/sitex"

  type RenderOptions = {
    assetTags?: string
    islandClientPreamble?: string
    islandClientSrc?: string
  }

  type RenderResult = {
    html: string
    params: Record<string, string>
    route: Route
  }

  export function getRoutes(): Promise<Route[]>
  export function render(
    url: string,
    options?: RenderOptions
  ): Promise<RenderResult | undefined>
  export function renderMatchedRoute(
    route: Route,
    params: Record<string, string>,
    options?: RenderOptions
  ): Promise<string>
}

declare module "sitex:pages" {
  type JsonValue =
    | string
    | number
    | boolean
    | null
    | JsonValue[]
    | { [key: string]: JsonValue }

  type Page = {
    readonly path: string
    readonly [key: string]: JsonValue
  }

  export function getPages(prefix?: string): Promise<Page[]>
  export function getPage(path: string): Promise<Page | undefined>
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
