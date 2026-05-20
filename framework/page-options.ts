import { ostraPlugin } from "../vite.config"

export type PageOptions = {
  output: "static" | "server" | "none"
  client: "load" | "none"
}

export function getPageOptions(type: string): PageOptions {
  const pages = ostraPlugin.ostraConfig.pages
  const pageType = pages.types[type as keyof typeof pages.types] as
    | {
        output?: PageOptions["output"]
        client?: PageOptions["client"]
      }
    | undefined

  const output = pageType?.output ?? pages.output ?? "static"
  const client = pageType?.client ?? pages.client ?? "none"

  return {
    output,
    client: output === "none" ? "load" : client,
  }
}
