declare module "virtual:sitex-islands" {
  import type { ComponentType } from "react"

  export const islands: Record<
    string,
    () => Promise<{ default: ComponentType<Record<string, unknown>> }>
  >
}

declare namespace React {
  interface Attributes {
    "client:load"?: boolean
    "client:only"?: boolean
  }
}
