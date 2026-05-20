import { z } from "zod"

import { seoSchema } from "./shared"

const modeBaseSchema = z.object({
  seo: seoSchema,
  title: z.string(),
  description: z.string(),
  output: z.enum(["static", "server", "none"]),
  client: z.enum(["load", "none"]),
  newsletter: z
    .object({
      title: z.string(),
      buttonLabel: z.string(),
    })
    .optional(),
})

export const staticNoneSchema = modeBaseSchema.extend({
  type: z.literal("static-none"),
  output: z.literal("static"),
  client: z.literal("none"),
})

export const staticLoadSchema = modeBaseSchema.extend({
  type: z.literal("static-load"),
  output: z.literal("static"),
  client: z.literal("load"),
})

export const serverNoneSchema = modeBaseSchema.extend({
  type: z.literal("server-none"),
  output: z.literal("server"),
  client: z.literal("none"),
})

export const serverLoadSchema = modeBaseSchema.extend({
  type: z.literal("server-load"),
  output: z.literal("server"),
  client: z.literal("load"),
})

export const noneLoadSchema = modeBaseSchema.extend({
  type: z.literal("none-load"),
  output: z.literal("none"),
  client: z.literal("load"),
})
