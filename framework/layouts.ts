import { ostraPlugin } from "../vite.config"

const pageTypes = ostraPlugin.ostraConfig.pages.types

export const layouts = Object.fromEntries(
  Object.entries(pageTypes).map(([name, pageType]) => [name, pageType.layout])
) as {
  [Name in keyof typeof pageTypes]: (typeof pageTypes)[Name]["layout"]
}
