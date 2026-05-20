import { hydrateRoot } from "react-dom/client"

import "./styles.css"
import type { AppRenderProps, PageRenderProps, ShellRenderProps } from "./render"
import { PageSlot } from "./page-slot"
import { layouts } from "virtual:ostra-layouts"
import { shell } from "virtual:ostra-shell"

const root = document.getElementById("ostra-app")
const data = document.getElementById("ostra-app-data")

if (!root || !data?.textContent) {
  throw new Error("Ostra app client could not find the app root or app data.")
}

const props = JSON.parse(data.textContent) as AppRenderProps
const Shell = shell as React.ComponentType<
  ShellRenderProps & { children: React.ReactNode }
>
const Layout = layouts[props.page.page.type as keyof typeof layouts] as
  | React.ComponentType<PageRenderProps>
  | undefined

if (!Layout) {
  throw new Error(
    `No Ostra layout found for page type "${props.page.page.type}".`
  )
}

hydrateRoot(
  root,
  <Shell {...props.shell}>
    <PageSlot>
      <Layout {...props.page} />
    </PageSlot>
  </Shell>
)
