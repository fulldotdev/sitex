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
    islandClientSrc?: string
    request?: Request
  }

  export function getRoutes(): Promise<Route[]>
  export function render(
    url: string,
    options?: RenderOptions
  ): Promise<string | undefined>
  export function renderServerResponse(
    request: Request,
    options?: RenderOptions
  ): Promise<Response | undefined>
}

declare module "sitex:content" {
  type JsonValue =
    | string
    | number
    | boolean
    | null
    | JsonValue[]
    | { [key: string]: JsonValue }

  type ContentPage<TContent extends JsonValue = { [key: string]: JsonValue }> =
    {
      readonly file: string
      readonly path: string
      readonly content: TContent
    }

  export function getPages(prefix?: string): Promise<ContentPage[]>
  export function getPage(path: string): Promise<ContentPage | undefined>
}

declare namespace React {
  interface Attributes {
    "client:load"?: boolean
    "client:only"?: boolean
  }
}
