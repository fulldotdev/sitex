import type { ReactNode } from "react"
import type { z } from "zod"

import type { ostraPlugin } from "../vite.config"

type Config = (typeof ostraPlugin)["ostraConfig"]
type PageTypes = Config["pages"]["types"]

export type LayoutName = keyof PageTypes

export type ShellProps = {
  global: z.infer<Config["globals"]["schema"]>
  page: z.infer<PageTypes[keyof PageTypes]["schema"]>
  children: ReactNode
  locale: string
  route: {
    file: string
    path: string
  }
  render: {
    at: string
    output: "static" | "server" | "none"
    client: "load" | "none"
  }
}

export type LayoutProps<Name extends LayoutName> = {
  page: z.infer<PageTypes[Name]["schema"]>
  global: z.infer<Config["globals"]["schema"]>
  content: string
  locale: string
  route: {
    file: string
    path: string
  }
  render: {
    at: string
    output: "static" | "server" | "none"
    client: "load" | "none"
  }
}

export type LayoutComponent<Name extends LayoutName> = (
  props: LayoutProps<Name>
) => ReactNode
