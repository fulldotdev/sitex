declare module "virtual:ostra-islands" {
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

declare module "astro:content" {
  export {
    defineCollection,
    getCollection,
    getEntry,
    z,
    type CollectionEntry,
    type CollectionEntryReference,
    type ContentData,
    type GetCollectionFilter,
  } from "./content"
}
