import { hydrateRoot } from "react-dom/client"

import "./styles.css"
import type { ShellRenderProps } from "./render"
import { PageSlot } from "./page-slot"
import { shell } from "virtual:ostra-shell"

const root = document.getElementById("ostra-app")
const data = document.getElementById("ostra-shell-data")

if (!root || !data?.textContent) {
  throw new Error(
    "Ostra shell client could not find the shell root or shell data."
  )
}

const props = JSON.parse(data.textContent) as ShellRenderProps
const Shell = shell as React.ComponentType<
  ShellRenderProps & { children: React.ReactNode }
>

hydrateRoot(
  root,
  <Shell {...props}>
    <PageSlot html={props.pageHtml} />
  </Shell>
)
