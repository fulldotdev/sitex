import { z } from "zod"

import { seoSchema } from "./shared"

export const homeSchema = z.object({
  type: z.literal("home"),
  seo: seoSchema,
  hero: z.object({
    title: z.string(),
    description: z.string(),
  }),
  newsletter: z.object({
    title: z.string(),
    buttonLabel: z.string(),
  }),
})

export type HomePage = z.infer<typeof homeSchema>
