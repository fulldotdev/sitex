import type { Plugin } from "vite-plus"

import { glob, readFile } from "node:fs/promises"
import path from "node:path"

import { defineConfig } from "vite-plus"
import { parse } from "yaml"

import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"

import { pageFileToRoutePath } from "../../packages/sitex/src/router/runtime"
import { sitex } from "../../packages/sitex/src/vite/plugin"
import { markdownPath } from "./src/lib/markdown"

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
    markdown(),
  ],
})

type Frontmatter = {
  title: string
  description: string
  hero?: {
    title: string
    description: string
    buttons?: { href: string; label: string }[]
  }
  features?: { title: string; description: string }[]
}

type Globals = {
  name: string
  sidebar: {
    sections: {
      navigation: { label: string; links: { href: string }[] }[]
    }[]
  }
}

/**
 * Builds each page's Markdown version and /llms.txt. A page's MDX file is
 * served as written at its path with .md (src/lib/markdown.ts); the home
 * layout renders its hero and features from the frontmatter, so they follow
 * the file as Markdown. /llms.txt lists the docs navigation with links to
 * the Markdown versions.
 */
function markdown(): Plugin {
  let root = ""

  return {
    name: "docs:markdown",
    apply: "build",
    applyToEnvironment: (environment) => environment.name === "client",
    configResolved(config) {
      root = config.root
    },
    async generateBundle() {
      const read = (file: string) => readFile(path.join(root, file), "utf8")
      const pages = new Map<string, Frontmatter>()

      for await (const file of glob("src/pages/**/*.mdx", { cwd: root })) {
        const source = await read(file)
        const page = parse(
          /^---\r?\n([\s\S]*?)\r?\n---/.exec(source)?.[1] ?? ""
        ) as Frontmatter
        const href = pageFileToRoutePath(file)
        const rendered = [
          page.hero && `# ${page.hero.title}`,
          page.hero?.description,
          ...(page.hero?.buttons ?? []).map(
            (button) => `[${button.label}](${new URL(button.href, siteUrl)})`
          ),
          ...(page.features ?? []).map(
            (feature) => `## ${feature.title}\n\n${feature.description}`
          ),
        ].filter(Boolean)

        pages.set(href, page)
        this.emitFile({
          type: "asset",
          fileName: markdownPath(href).slice(1),
          source: rendered.length
            ? `${source.trimEnd()}\n\n${rendered.join("\n\n")}\n`
            : source,
        })
      }

      const globals = parse(await read("src/globals/index.yaml")) as Globals
      const groups = globals.sidebar.sections.flatMap(
        (section) => section.navigation
      )
      const lines = [
        `# ${globals.name}`,
        "",
        `> ${pages.get("/")?.description}`,
        "",
        `Every page has a Markdown version: add \`.md\` to its URL. The homepage's is ${siteUrl}/index.md.`,
      ]

      for (const group of groups) {
        lines.push("", `## ${group.label}`, "")

        for (const { href } of group.links) {
          const page = pages.get(href)
          if (!page) throw new Error(`No page for navigation link ${href}`)
          lines.push(
            `- [${page.title}](${siteUrl}${markdownPath(href)}): ${page.description}`
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
