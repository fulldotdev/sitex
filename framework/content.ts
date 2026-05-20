import { readFile } from "node:fs/promises"

import matter from "gray-matter"
import MarkdownIt from "markdown-it"
import type { z } from "zod"

import { ostraPlugin } from "../vite.config"

const ostraConfig = ostraPlugin.ostraConfig

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
})

export type MarkdownPage = {
  data: PageData
  content: string
  html: string
}

export async function readPage(file: string): Promise<MarkdownPage> {
  const source = await readFile(file, "utf8")
  const parsed = matter(source)
  const data = parsePageData(parsed.data)

  return {
    data,
    content: parsed.content,
    html: markdown.render(parsed.content),
  }
}

export async function readGlobal(): Promise<GlobalData> {
  return readGlobalForLocale("en")
}

export async function readGlobalForLocale(locale: string): Promise<GlobalData> {
  const file =
    locale === "en"
      ? "src/content/globals/index.yaml"
      : `src/content/globals/${locale}.yaml`
  const source = await readFile(file, "utf8")
  const parsed = matter(`---\n${source}\n---`)

  return ostraConfig.globals.schema.parse(parsed.data)
}

function parsePageData(data: unknown): PageData {
  if (!data || typeof data !== "object" || !("type" in data)) {
    throw new Error('Page frontmatter must include a "type" field.')
  }

  const type = String((data as { type: unknown }).type)
  const schema =
    ostraConfig.pages.types[type as keyof typeof ostraConfig.pages.types]?.schema

  if (!schema) {
    throw new Error(`No layout schema configured for page type "${type}".`)
  }

  return schema.parse(data) as PageData
}

type PageData = z.infer<
  (typeof ostraConfig)["pages"]["types"][keyof (typeof ostraConfig)["pages"]["types"]]["schema"]
>
type GlobalData = z.infer<(typeof ostraConfig)["globals"]["schema"]>
