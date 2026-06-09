declare module "nitro/vite" {
  import type { Plugin } from "vite-plus"

  export function nitro(pluginConfig?: Record<string, unknown>): Plugin[]
}
