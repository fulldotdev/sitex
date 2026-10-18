import type { Plugin } from "vite-plus"

import { readFile } from "node:fs/promises"
import path from "node:path"

import { defineConfig } from "vite-plus"
import { parse } from "yaml"

import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"

import { sitex } from "../../packages/sitex/src/vite/plugin"

const siteUrl = "https://sitex.full.dev"

export default defineConfig({
  plugins: [
    react(),
    sitex({
      site: {
        url: siteUrl,
      },
      mdx: {
        components: {
          pre: "@/components/ui/code",
        },
      },
    }),
    tailwindcss(),
    llmsTxt(),
  ],
})

type Frontmatter = { title: string; description: string }

type Globals = {
  sidebar: {
    sections: {
      navigation: { label: string; links: { href: string }[] }[]
    }[]
  }
}

/** Builds /llms.txt from the docs navigation and each page's frontmatter. */
function llmsTxt(): Plugin {
  let root = ""

  return {
    name: "docs:llms-txt",
    apply: "build",
    applyToEnvironment: (environment) => environment.name === "client",
    configResolved(config) {
      root = config.root
    },
    async generateBundle() {
      const read = (file: string) => readFile(path.join(root, file), "utf8")
      const readPage = async (href: string) => {
        const base = path.join("src/pages", href === "/" ? "index" : href)
        const source = await read(`${base}.mdx`).catch(() =>
          read(path.join(base, "index.mdx"))
        )
        const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source)?.[1]

        return parse(frontmatter ?? "") as Frontmatter
      }

      const home = await readPage("/")
      const globals = parse(await read("src/globals/index.yaml")) as Globals
      const groups = globals.sidebar.sections.flatMap(
        (section) => section.navigation
      )
      const lines = [`# ${home.title}`, "", `> ${home.description}`]

      for (const group of groups) {
        lines.push("", `## ${group.label}`, "")

        for (const { href } of group.links) {
          const page = await readPage(href)
          lines.push(
            `- [${page.title}](${siteUrl}${href}): ${page.description}`
          )
        }
      }

      this.emitFile({
        type: "asset",
        fileName: "llms.txt",
        source: `${lines.join("\n")}\n`,
      })
    },
  }
}
