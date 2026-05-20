import { ostraPlugin } from "../vite.config"

export const shell = ostraPlugin.ostraConfig.shell.layout
export const shellOptions = {
  client: ostraPlugin.ostraConfig.shell.client ?? "none",
} as const
