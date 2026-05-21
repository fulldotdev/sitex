import { defineCollection } from "astro:content"

import { globalSchema } from "@/schemas/global"
import { pageSchema } from "@/schemas/page"

export const collections = {
  pages: defineCollection({
    schema: pageSchema,
  }),
  globals: defineCollection({
    schema: globalSchema,
  }),
}
