import { z } from "zod"

export const seoSchema = z.object({
  title: z.string(),
  description: z.string(),
})
