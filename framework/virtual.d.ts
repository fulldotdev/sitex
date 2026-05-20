declare module "virtual:ostra-layouts" {
  import type * as React from "react"

  export const layouts: Record<string, React.ComponentType<any>>
}

declare module "virtual:ostra-shell" {
  import type * as React from "react"

  export const shell: React.ComponentType<any>
}
