import { z } from "zod"

import type { ostraPlugin } from "../../vite.config"

import { seoSchema } from "./layouts/shared"

export const pageSchema = z.object({
  type: z.string(),
  seo: seoSchema,
})

export type PageData = z.infer<
  (typeof ostraPlugin)["ostraConfig"]["pages"]["types"][keyof (typeof ostraPlugin)["ostraConfig"]["pages"]["types"]]["schema"]
>
