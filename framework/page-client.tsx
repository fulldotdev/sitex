import { createRoot, hydrateRoot } from "react-dom/client"

import "./styles.css"
import type { PageRenderProps } from "./render"
import { layouts } from "virtual:ostra-layouts"

const root = document.getElementById("ostra-page")
const data = document.getElementById("ostra-page-data")

if (!root || !data?.textContent) {
  throw new Error("Ostra page client could not find the page root or page data.")
}

const props = JSON.parse(data.textContent) as PageRenderProps
const Layout = layouts[props.page.type as keyof typeof layouts] as
  | React.ComponentType<PageRenderProps>
  | undefined

if (!Layout) {
  throw new Error(`No Ostra layout found for page type "${props.page.type}".`)
}

if (props.render.output === "none") {
  createRoot(root).render(<Layout {...props} />)
} else {
  hydrateRoot(root, <Layout {...props} />)
}
