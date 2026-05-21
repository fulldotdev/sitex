import { z } from "zod"

import { articleSchema } from "./layouts/article"
import { homeSchema } from "./layouts/home"
import { seoSchema } from "./layouts/shared"

export const baseSchema = z.object({
  type: z.string(),
  seo: seoSchema,
})

export const pageSchema = z.discriminatedUnion("type", [homeSchema, articleSchema])

export type PageData = z.infer<typeof baseSchema>
