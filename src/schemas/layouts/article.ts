import { z } from "zod"

import { seoSchema } from "./shared"

export const articleSchema = z.object({
  type: z.literal("article"),
  seo: seoSchema,
  title: z.string(),
  description: z.string(),
})

export type ArticlePage = z.infer<typeof articleSchema>
