declare module "virtual:sitex-islands" {
  import type { ComponentType } from "react"

  export const islands: Record<
    string,
    () => Promise<{ default: ComponentType<Record<string, unknown>> }>
  >
}

declare module "virtual:sitex-routes" {
  import type { ReactNode } from "react"

  type Route = {
    file: string
    path: string
    layout: () => ReactNode | Promise<ReactNode>
  }

  export function getRoutes(): Promise<Route[]>
}

declare module "virtual:sitex-render" {
  import type { ReactNode } from "react"

  type Route = {
    file: string
    path: string
    layout: () => ReactNode | Promise<ReactNode>
  }

  type RenderOptions = {
    assetTags?: string
    islandClientSrc?: string
  }

  export function getRoutes(): Promise<Route[]>
  export function render(
    url: string,
    options?: RenderOptions
  ): Promise<string | undefined>
}

declare namespace React {
  interface Attributes {
    "client:load"?: boolean
    "client:only"?: boolean
  }
}
