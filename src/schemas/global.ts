import { z } from "zod"

export const globalSchema = z.object({
  locale: z.string(),
  siteName: z.string(),
  nav: z.array(
    z.object({
      label: z.string(),
      href: z.string(),
    })
  ),
})

export type GlobalData = z.infer<typeof globalSchema>
